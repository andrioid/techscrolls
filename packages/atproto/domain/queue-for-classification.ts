import { AtUri, type AppBskyFeedPost } from "@atproto/api";
import lande from "lande";
import type { AtContext } from "../context";
import { postRecords, postTable } from "../db/schema";
import { LISTEN_NOTIFY_POSTQUEUE } from "../scripts/classify";

export type FeedPostWithUri = {
  uri: string;
  cid: string;
  record: AppBskyFeedPost.Record;
};

export async function queueForClassification(
  ctx: AtContext,
  post: FeedPostWithUri
) {
  // Eliminate anything other than english
  if (!post.record.langs?.includes("en")) return;
  const text = post.record.text;

  const langProb = lande(text);
  // If english isn't the most likely language, we skip it entirely
  const isNotEnglish =
    text.length > 20 && langProb[0] && langProb[0][0] !== "eng";
  if (isNotEnglish) {
    console.log("[queue] not english: ", text);
    return;
  }

  const uri = new AtUri(post.uri);
  const authorId = uri.hostname;
  try {
    await ctx.db.transaction(async (tx) => {
      await tx
        .insert(postTable)
        .values({
          authorId,
          id: post.uri,
          created: post.record.createdAt,
          modified: post.record.createdAt,
        })
        .onConflictDoNothing();
      // TODO: Maybe store author in a table later for scoring
      await tx
        .insert(postRecords)
        .values({
          type: "AppBskyFeedPost.Record",
          postId: post.uri,
          value: post.record,
          cid: post.cid,
        })
        .onConflictDoNothing();
    });
    ctx.db.$client.notify(
      LISTEN_NOTIFY_POSTQUEUE,
      JSON.stringify({
        uri: post.uri,
        cid: post.cid,
        record: post.record,
      } satisfies FeedPostWithUri)
    );
    console.log(`[queue] ${post.uri} stored`);
  } catch (err) {
    throw new Error(`[queue] failed to store post: ${post.uri}`, {
      cause: err,
    });
  }
}

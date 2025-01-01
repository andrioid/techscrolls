import { AtUri, type AppBskyFeedPost } from "@atproto/api";
import type { AtContext } from "../context";
import { LISTEN_NOTIFY_POSTQUEUE } from "../scripts/classifier";
import { extractTextFromPost } from "./extract-text-from-post";
import { isForeignLanguage } from "./is-foreign-language";
import { postRecords } from "./post/post-record.table";
import { postTexts } from "./post/post-texts.table";
import { postTable } from "./post/post.table";

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

  const extractedText = await extractTextFromPost(ctx, post);
  if (isForeignLanguage(extractedText.join("\n"))) {
    // Don't want to waste resources on text in other languages
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
          created: new Date(post.record.createdAt),
          modified: new Date(post.record.createdAt),
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
      for (const et of extractedText) {
        await tx
          .insert(postTexts)
          .values({
            post_id: post.uri,
            source: et.type,
            text: et.text,
          })
          .onConflictDoNothing();
      }
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

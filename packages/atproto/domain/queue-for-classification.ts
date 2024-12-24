import { AtUri, type AppBskyFeedPost } from "@atproto/api";
import type { AtContext } from "../context";
import { postRecords, postTable } from "../db/schema";

export type FeedPostWithUri = {
  uri: string;
  cid: string;
  record: AppBskyFeedPost.Record;
};

export async function queueForClassification(
  ctx: AtContext,
  post: FeedPostWithUri
) {
  //if (!!post.record.reply) return;
  // TODO: Eliminate anything other than english
  if (!post.record.langs?.includes("en")) return;

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
    console.log(`[queue] ${post.uri} stored`);
  } catch (err) {
    throw new Error(`[queue] failed to store post: ${post.uri}`, {
      cause: err,
    });
  }
}

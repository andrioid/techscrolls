import { AtUri, type AppBskyFeedPost } from "@atproto/api";
import type { AppContext } from "../context";
import { post_queue } from "../db/schema";

export type FeedPostWithUri = {
  uri: string;
  record: AppBskyFeedPost.Record;
};

export async function queueForClassification(
  ctx: AppContext,
  // TODO: Just receive the entire PostRecord
  post: FeedPostWithUri
) {
  // TODO: Eliminate replies
  // TODO: Eliminate anything other than english

  const uri = new AtUri(post.uri);
  const authorId = uri.hostname;

  await ctx.db.transaction(async (tx) => {
    await tx.insert(post_queue).values({
      type: "AppBskyFeedPost.Record",
      postId: post.uri,
      value: post.record,
    });
  });
  console.log(`[classifier] ${post.uri} stored`);
}

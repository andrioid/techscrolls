import { type CommitEvent, type CommitRepost } from "@andrioid/jetstream";
import { AtUri } from "@atproto/api";
import { eq } from "drizzle-orm";
import type { AtContext } from "../context";
import { repostTable } from "./post/post-reposts.table";
import { postTable } from "./post/post.table";

// TODO: This should probably receive the full jetstream event
export async function queueRePost(
  ctx: AtContext,
  postMsg: CommitEvent<CommitRepost>
) {
  const originalUri = postMsg.commit.record.subject.uri;
  const originalAtUri = new AtUri(originalUri);

  // - TODO
  // - Create a table for reposts
  // - Remove collection for post table, we are not going to use it

  // 1. If we already have this post, set lastMentioned
  const [existingPost] = await ctx.db
    .select()
    .from(postTable)
    .where(eq(postTable.id, originalUri));

  // 0. Store the repost
  const repostUri = AtUri.make(
    postMsg.did,
    postMsg.commit.collection,
    postMsg.commit.rkey
  );

  if (existingPost) {
    // Update lastMentioned
    await ctx.db
      .update(postTable)
      .set({
        lastMentioned: new Date(postMsg.commit.record.createdAt),
      })
      .where(eq(postTable.id, existingPost.id));
    return;
  }
  // 2. Let's store the posturi, and fetch it later
  // TODO: Here we should use the worker queue and batch these requests
  await ctx.db.transaction(async (tx) => {
    await tx
      .insert(postTable)
      .values({
        id: originalUri,
        authorId: originalAtUri.hostname,
      })
      .onConflictDoNothing();
  });

  // 3. Store the repost post individually with the repost collection
  await ctx.db
    .insert(repostTable)
    .values({
      repostUri: repostUri.toString(),
      authorId: postMsg.did,
      postId: originalUri,
    })
    .onConflictDoNothing();
}

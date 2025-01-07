import { type CommitEvent, type CommitRepost } from "@andrioid/jetstream";
import { AtUri } from "@atproto/api";
import { eq } from "drizzle-orm";
import type { AtContext } from "../context";
import { postTable } from "./post/post.table";
import { followTable } from "./user/user-follows.table";
import { didTable } from "./user/user.table";

// TODO: This should probably receive the full jetstream event
export async function queueRePost(
  ctx: AtContext,
  postMsg: CommitEvent<CommitRepost>
) {
  const postUri = postMsg.commit.record.subject.uri;
  const atUri = new AtUri(postUri);

  // 1. If we already have this post, abort (for now - maybe add a surfaced_date)
  const [existingPost] = await ctx.db
    .select()
    .from(postTable)
    .where(eq(postTable.id, postUri));
  if (existingPost) return;
  // 2. Fetch post via API, since jetstream doesn't include it
  console.log("[atproto] fetching post", postUri);

  // Plan B: Let's add the post author to follows instead of trying to treat these as users
  await ctx.db.transaction(async (tx) => {
    const placeHolderDid = "did:web:this-service-placeholder";
    await tx
      .insert(didTable)
      .values({
        did: placeHolderDid,
        addedBy: "repost",
      })
      .onConflictDoNothing();
    await tx
      .insert(followTable)
      .values({
        followedBy: "did:web:this-service-placeholder",
        follows: atUri.hostname,
      })
      .onConflictDoNothing();
  });
  return;
  /*
  const res = await ctx.atpAgentPublic.getPosts({
    uris: [postMsg.commit.record.subject.uri],
  });
  if (!res.success) {
    throw new Error("Failed to get post:" + postUri);
  }

  if (!res.data.posts && res.data.posts !== 1) return;
  const post = res.data.posts[0];
  if (!AppBskyFeedPost.isRecord(post.record)) {
    console.warn("found post, but it's not a feedpost record");
    return;
  }
  await storePost(ctx, {
    cid: post.cid,
    record: post.record,
    uri: post.uri,
  });

  // 3. Add the post author to our user table (maybe)
  // This got me rate-limited very fast
  */
}

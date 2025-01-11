import type { AppBskyFeedGetFeedSkeleton } from "@atproto/api";
import { and, desc, eq, gt, gte } from "drizzle-orm/expressions";
import type { FeedHandlerArgs, FeedHandlerOutput } from "../feeds";
import { fromCursor, toCursor } from "../helpers/cursor";
import { getOrUpdateFollows } from "./get-or-update-follows";
import { repostTable } from "./post/post-reposts.table";
import { postScores } from "./post/post-scores.view";
import { postTable } from "./post/post.table";
import { followTable } from "./user/user-follows.table";

export async function getTechFollowingFeed(
  args: FeedHandlerArgs
): Promise<FeedHandlerOutput> {
  const { ctx, actorDid, cursor, limit = 50 } = args;

  await getOrUpdateFollows(ctx, actorDid);

  const orderByPrimary = "lastMentioned";

  // Subquery for reposts
  const sqReposts = ctx.db
    .select({
      postId: repostTable.postId,
      repostUri: repostTable.repostUri,
      created: repostTable.created,
    })
    .from(repostTable)
    .innerJoin(followTable, eq(repostTable.authorId, followTable.follows))
    .where(eq(followTable.followedBy, actorDid))
    .orderBy(desc(repostTable.created))
    .limit(1)
    .as("sqReposts");

  const fls = ctx.db
    .select()
    .from(followTable)
    .where(eq(followTable.followedBy, actorDid))
    .as("fls");

  const posts = await ctx.db
    .select({
      id: postTable.id,
      repost: sqReposts.repostUri,
      date: sqReposts.repostUri ? sqReposts.created : postTable.created,
    })
    .from(postTable)
    .innerJoin(fls, eq(postTable.authorId, fls.follows))
    .innerJoin(
      postScores,
      and(
        eq(postScores.postId, postTable.id),
        eq(postScores.tagId, "tech"),
        cursor ? gt(postTable.created, fromCursor(cursor)) : undefined
      )
    )
    .leftJoin(sqReposts, eq(sqReposts.postId, postTable.id))
    .where(gte(postScores.avgScore, 80)) // TODO: Raise this to 80
    .orderBy(desc(sqReposts.repostUri ? sqReposts.created : postTable.created))
    .limit(limit);

  return {
    feed: posts.map((p) => {
      const reason = p.repost
        ? {
            repost: p.repost,
          }
        : undefined;
      return {
        post: p.id,
        reason,
        feedContext: "tech-following",
      } satisfies AppBskyFeedGetFeedSkeleton.Response["data"][number];
    }),
    cursor:
      posts.length > 0 ? toCursor(posts[posts.length - 1].date) : undefined,
  };
}

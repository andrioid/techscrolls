import type { AppBskyFeedGetFeedSkeleton } from "@atproto/api";
import { and, desc, eq, gt, gte, or } from "drizzle-orm/expressions";

import type { FeedHandlerArgs, FeedHandlerOutput } from "../feeds";
import { fromCursor, toCursor } from "../helpers/cursor";

import { sql } from "drizzle-orm";
import { PostFlags } from "./post/post-flags";
import { postScores } from "./post/post-scores.view";
import { postTable } from "./post/post.table";
import { followTable } from "./user/user-follows.table";

export async function getTechAllFeed(
  args: FeedHandlerArgs
): Promise<FeedHandlerOutput> {
  const { ctx, cursor, actorDid, limit = 50 } = args;

  // TODO: Only want posts here and possibly sort by latest activity
  const posts = await ctx.db
    .select({
      id: postTable.id,
      created: postTable.created,
      lastMentioned: postTable.lastMentioned,
    })
    .from(postTable)
    .leftJoin(followTable, eq(postTable.authorId, followTable.follows))
    .innerJoin(
      postScores,
      and(eq(postScores.postId, postTable.id), eq(postScores.tagId, "tech"))
    )
    .where(
      and(
        cursor ? gt(postTable.lastMentioned, fromCursor(cursor)) : undefined,
        gt(postTable.flags, 0),
        gte(postScores.avgScore, 70), // TODO 80
        or(
          sql`(${postTable.flags} & (${PostFlags.Replies})) = 0`,
          actorDid ? eq(followTable.followedBy, actorDid) : undefined
        )
      )
    )
    .orderBy(desc(postTable.lastMentioned))
    .groupBy(postTable.id)

    .limit(limit);

  return {
    feed: posts.map((post) => {
      return {
        post: post.id,
        feedContext: "tech-all",
      };
    }),
    cursor:
      posts.length > 0
        ? toCursor(posts[posts.length - 1].lastMentioned)
        : undefined,
  } satisfies AppBskyFeedGetFeedSkeleton.Response["data"][number];
}

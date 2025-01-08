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
  const { ctx, cursor, actorDid } = args;

  // TODO: Only want posts here and possibly sort by latest activity
  const posts = await ctx.db
    .select({ id: postTable.id, created: postTable.created })
    .from(postTable)
    .leftJoin(followTable, eq(postTable.authorId, followTable.follows))
    .innerJoin(
      postScores,
      and(
        eq(postScores.postId, postTable.id),
        eq(postScores.tagId, "tech"),
        cursor ? gt(postTable.created, fromCursor(cursor)) : undefined
      )
    )
    .where(
      and(
        gt(postTable.flags, 0),
        gte(postScores.avgScore, 75), // TODO 80
        or(
          sql`(${postTable.flags} & (${PostFlags.Replies})) = 0`,
          actorDid ? eq(followTable.followedBy, actorDid) : undefined
        )
      )
    )
    .orderBy(desc(postTable.created))

    .limit(30);

  return {
    feed: posts.map((post) => ({ post: post.id })),
    cursor:
      posts.length > 0 ? toCursor(posts[posts.length - 1].created) : undefined,
  };
}

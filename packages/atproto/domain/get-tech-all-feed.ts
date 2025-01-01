import { and, desc, eq, gt, gte } from "drizzle-orm/expressions";

import type { FeedHandlerArgs, FeedHandlerOutput } from "../feeds";
import { fromCursor, toCursor } from "../helpers/cursor";

import { postScores } from "./post/post-scores.view";
import { postTable } from "./post/post.table";

export async function getTechAllFeed(
  args: FeedHandlerArgs
): Promise<FeedHandlerOutput> {
  const { ctx, cursor } = args;

  const posts = await ctx.db
    .select({ id: postTable.id, created: postTable.created })
    .from(postTable)
    .innerJoin(
      postScores,
      and(
        eq(postScores.postId, postTable.id),
        eq(postScores.tagId, "tech"),
        cursor ? gt(postTable.created, fromCursor(cursor)) : undefined
      )
    )
    .where(gte(postScores.avgScore, 80))
    .orderBy(desc(postTable.created))

    .limit(30);

  return {
    feed: posts.map((post) => ({ post: post.id })),
    cursor:
      posts.length > 0 ? toCursor(posts[posts.length - 1].created) : undefined,
  };
}

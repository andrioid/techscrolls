import { and, desc, eq, gt, gte } from "drizzle-orm/expressions";
import type { FeedHandlerArgs, FeedHandlerOutput } from "../feeds";
import { fromCursor, toCursor } from "../helpers/cursor";
import { getOrUpdateFollows } from "./get-or-update-follows";
import { postScores } from "./post/post-scores.view";
import { postTable } from "./post/post.table";
import { followTable } from "./user/user-follows.table";

export async function getTechFollowingFeed(
  args: FeedHandlerArgs
): Promise<FeedHandlerOutput> {
  const { ctx, actorDid, cursor } = args;

  await getOrUpdateFollows(ctx, actorDid);

  const fls = ctx.db
    .select()
    .from(followTable)
    .where(eq(followTable.followedBy, actorDid))
    .as("fls");

  const posts = await ctx.db
    .select({ id: postTable.id, created: postTable.created })
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
    .where(gte(postScores.avgScore, 80)) // TODO: Raise this to 80
    .orderBy(desc(postTable.created))
    .limit(50);

  return {
    feed: posts.map((p) => ({
      post: p.id,
    })),
    cursor:
      posts.length > 0 ? toCursor(posts[posts.length - 1].created) : undefined,
  };
}

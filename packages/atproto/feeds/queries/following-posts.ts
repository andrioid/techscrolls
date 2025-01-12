import { and, eq, gte } from "drizzle-orm";
import type { FeedHandlerArgs } from "..";
import { repostTable } from "../../domain/post/post-reposts.table";
import { postScores } from "../../domain/post/post-scores.view";
import { postTable } from "../../domain/post/post.table";
import { followingSubQuery } from "./following";

export function followingPostsQuery(args: FeedHandlerArgs) {
  const { ctx, actorDid, limit = 30 } = args;
  const fls = followingSubQuery(args);
  const postsQuery = ctx.db
    .select({
      id: postTable.id,
      repost: repostTable.repostUri,
      date: postTable.lastMentioned,
    })
    .from(postTable)
    .innerJoin(fls, eq(postTable.authorId, fls.follows))
    .leftJoin(fls, eq(repostTable.authorId, fls.follows))
    .innerJoin(
      postScores,
      and(eq(postScores.postId, postTable.id), gte(postScores.avgScore, 70))
    );
  return postsQuery;
}

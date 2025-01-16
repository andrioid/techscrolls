import { and, desc, eq, gte } from "drizzle-orm";
import type { FeedHandlerArgs } from "..";
import { repostTable } from "../../domain/post/post-reposts.table";
import { postScores } from "../../domain/post/post-scores.view";
import { postTable } from "../../domain/post/post.table";
import { followingSubQuery } from "./sq-following";

export function followingRepostsQuery(args: FeedHandlerArgs) {
  const { ctx, limit = 30 } = args;
  const fls = followingSubQuery(args);
  const repostsQuery = ctx.db
    .select({
      id: postTable.id,
      repost: repostTable.repostUri,
      date: repostTable.created,
    })
    .from(postTable)
    // Only reposts
    .innerJoin(repostTable, eq(repostTable.postId, postTable.id))
    // Only reposts by those I follow
    .innerJoin(fls, eq(repostTable.authorId, fls.follows))
    // Only within score condition
    .innerJoin(
      postScores,
      and(eq(postScores.postId, postTable.id), gte(postScores.avgScore, 70))
    )
    .groupBy(postTable.id, repostTable.repostUri)
    .orderBy(desc(postTable.lastMentioned));
  return repostsQuery;
}

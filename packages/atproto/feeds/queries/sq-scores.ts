import { and, avg, eq, SQL, sql } from "drizzle-orm";
import type { FeedHandlerArgs } from "..";
import type { AtContext } from "../../context";
import { postTags } from "../../domain/post/post-tag.table";
import { tagTable } from "../../domain/tag/tag.table";

export function tagScoreSubQuery(
  db: AtContext["db"],
  tagFilters: Exclude<FeedHandlerArgs["tagFilters"], undefined>
) {
  let filters: Array<SQL | undefined> = [];

  for (const tf of tagFilters) {
    filters.push(
      and(
        eq(postTags.tagId, tf.tag),
        tf.minScore
          ? sql<number>`avg(${postTags.score}) >= ${tf.minScore}`
          : undefined,
        tf.maxScore
          ? sql<number>`avg(${postTags.score}) < ${tf.maxScore}`
          : undefined
      )
    );
  }

  return db
    .selectDistinct({
      tag: postTags.tagId,
      postId: postTags.postId,
      avgScore: avg(postTags.score).as("avg_score"),
    })
    .from(postTags)
    .innerJoin(tagTable, eq(postTags.tagId, tagTable.id))
    .groupBy(postTags.postId, postTags.tagId)
    .having(and(...filters))
    .as("scores_subquery");
}

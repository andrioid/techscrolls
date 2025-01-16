import { and, avg, eq, sql } from "drizzle-orm";
import type { AtContext } from "../../context";
import { postTags } from "../../domain/post/post-tag.table";
import { tagTable } from "../../domain/tag/tag.table";

export function sqScores(db: AtContext["db"]) {
  return db
    .selectDistinct({
      tag: postTags.tagId,
      postId: postTags.postId,
      avgScore: avg(postTags.score).as("avg_score"),
    })
    .from(postTags)
    .innerJoin(tagTable, eq(postTags.tagId, tagTable.id))
    .groupBy(postTags.postId, postTags.tagId)
    .having(and(sql<number>`avg(${postTags.score}) > 70`))
    .as("scores_subquery");
}

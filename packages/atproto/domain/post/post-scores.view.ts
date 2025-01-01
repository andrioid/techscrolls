import { sql } from "drizzle-orm";
import { pgView } from "drizzle-orm/pg-core";
import { postTags } from "./post-tag.table";

// Views

export const postScores = pgView("posts_tag_avg").as((qb) => {
  return qb
    .select({
      postId: postTags.postId,
      tagId: postTags.tagId,
      avgScore: sql`round(avg(${postTags.score}), 0)`.as("avg_score"),
      algos: sql`ARRAY_AGG(DISTINCT ${postTags.algo})`.as("algos"),
    })
    .from(postTags)
    .groupBy(sql`${postTags.postId}, ${postTags.tagId}`);
});

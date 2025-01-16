import { and, eq, sql } from "drizzle-orm";
import type { AtContext } from "../context";
import { postTags } from "./post/post-tag.table";
import { tagTable } from "./tag/tag.table";

export async function getPostTags(ctx: AtContext, postUri: string) {
  const res = await ctx.db
    .select({
      tag: tagTable.id,
      scores: sql<
        Array<{
          algo: string;
          score: number;
        }>
      >`json_agg(
        json_build_object(
            'algo', ${postTags.algo},
            'score', ${postTags.score}
        )
      )`,
    })
    .from(tagTable)
    .leftJoin(
      postTags,
      and(eq(tagTable.id, postTags.tagId), eq(postTags.postId, postUri))
    )
    .groupBy(tagTable.id);

  if (res.length === 0) return [];
  return res.map((tag) => ({
    ...tag,
    scores: tag.scores.filter((scores) => scores.algo !== null),
  }));
}

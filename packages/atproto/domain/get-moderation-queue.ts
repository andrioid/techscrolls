import { and, desc, eq, gte, ilike, lte } from "drizzle-orm";
import type { AtContext } from "../context";
import { postScores } from "./post/post-scores.view";
import { postTexts } from "./post/post-texts.table";
import { postTable } from "./post/post.table";

const PER_PAGE = 25;

// TODO: This should in fact follow the same interface as the feed handlers
export async function getModerationPosts(
  ctx: AtContext,
  options: {
    query?: string;
    page?: number;
    minScore?: number;
    maxScore?: number;
  }
) {
  const offset = options?.page ? (options.page - 1) * PER_PAGE : 0;

  return await ctx.db
    .select({
      postId: postTable.id,
    })
    .from(postTable)
    .innerJoin(postTexts, eq(postTable.id, postTexts.post_id))
    .leftJoin(postScores, eq(postTable.id, postScores.postId))
    .where(
      and(
        options?.query
          ? ilike(postTexts.text, `%${options.query}%`)
          : undefined,
        options?.minScore
          ? gte(postScores.avgScore, options?.minScore)
          : undefined,
        options?.maxScore
          ? lte(postScores.avgScore, options?.maxScore)
          : undefined
      )
    )
    .groupBy(postTable.id)
    .orderBy(desc(postTable.created))
    .limit(PER_PAGE)
    .offset(offset);
}

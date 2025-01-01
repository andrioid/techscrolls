import { and, desc, eq, gte, ilike } from "drizzle-orm";
import type { AtContext } from "../context";
import { postScores } from "./post/post-scores.view";
import { postTexts } from "./post/post-texts.table";
import { postTable } from "./post/post.table";

export async function getModerationPosts(
  ctx: AtContext,
  options: {
    query?: string;
    offset?: number;
    minScore?: number;
  }
) {
  return await ctx.db
    .select({
      postId: postTable.id,
    })
    .from(postTable)
    .innerJoin(postTexts, eq(postTable.id, postTexts.post_id))
    .innerJoin(postScores, eq(postTable.id, postScores.postId))
    .where(
      and(
        options?.query
          ? ilike(postTexts.text, `%${options.query}%`)
          : undefined,
        options?.minScore
          ? gte(postScores.avgScore, options?.minScore)
          : undefined
      )
    )
    .groupBy(postTable.id)
    .orderBy(desc(postTable.created))

    .limit(25);
}

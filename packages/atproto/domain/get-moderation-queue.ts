import { and, desc, eq, ilike } from "drizzle-orm";
import type { AtContext } from "../context";
import { postTexts } from "./post/post-texts.table";
import { postTable } from "./post/post.table";

export async function getModerationPosts(
  ctx: AtContext,
  options: {
    query?: string;
    offset?: number;
  }
) {
  return await ctx.db
    .select({
      postId: postTable.id,
    })
    .from(postTable)
    .innerJoin(postTexts, eq(postTable.id, postTexts.post_id))
    .where(
      and(
        options?.query ? ilike(postTexts.text, `%${options.query}%`) : undefined
      )
    )
    .groupBy(postTable.id)
    .orderBy(desc(postTable.created))

    .limit(25);
}

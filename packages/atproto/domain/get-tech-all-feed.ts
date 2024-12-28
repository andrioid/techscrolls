import { and, desc, eq, gte } from "drizzle-orm/expressions";
import type { AtContext } from "../context";
import { followTable, postScores, postTable } from "../db/schema";

export async function getTechAllFeed(
  ctx: AtContext,
  did: string,
  limit: number = 30
): Promise<Array<string>> {
  const fls = ctx.db
    .select()
    .from(followTable)
    .where(eq(followTable.followedBy, did))
    .as("fls");

  const posts = await ctx.db
    .select({ id: postTable.id })
    .from(postTable)
    .innerJoin(
      postScores,
      and(eq(postScores.postId, postTable.id), eq(postScores.tagId, "tech"))
    )
    .where(gte(postScores.avgScore, 80)) // TODO: Raise this to 80
    .orderBy(desc(postTable.created))
    .limit(limit);

  return posts.map((post) => post.id);
}

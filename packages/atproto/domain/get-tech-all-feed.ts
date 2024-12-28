import { and, desc, eq, gte } from "drizzle-orm/expressions";
import { postScores, postTable } from "../db/schema";
import type { FeedHandlerArgs } from "../feeds";

export async function getTechAllFeed(
  args: FeedHandlerArgs
): Promise<Array<string>> {
  const { ctx, cursor } = args;

  const posts = await ctx.db
    .select({ id: postTable.id })
    .from(postTable)
    .innerJoin(
      postScores,
      and(eq(postScores.postId, postTable.id), eq(postScores.tagId, "tech"))
    )
    .where(gte(postScores.avgScore, 80))
    .orderBy(desc(postTable.created))

    .limit(30);

  return posts.map((post) => post.id);
}

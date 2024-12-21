import { eq } from "drizzle-orm/expressions";
import type { AppContext } from "../context";
import { followTable, postTable } from "../db/schema";

export async function getFeedPosts(
  ctx: AppContext,
  did: string
): Promise<Array<string>> {
  const fls = ctx.db
    .select()
    .from(followTable)
    .where(eq(followTable.followedBy, did))
    .as("fls");

  const posts = await ctx.db
    .select({ id: postTable.id })
    .from(postTable)
    .innerJoin(fls, eq(postTable.authorId, fls.follows));

  return posts.map((post) => post.id);
}

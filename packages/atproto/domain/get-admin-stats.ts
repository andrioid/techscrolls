import { count, countDistinct, sql } from "drizzle-orm";
import type { AtContext } from "../context";
import { followTable, postTable, userTable } from "../db/schema";

export async function getAdminStats(ctx: AtContext) {
  let output: Array<{
    label: string;
    value: number | string;
  }> = [];

  // Number of follows (dids we're subscribing to)
  const noFollows = await ctx.db
    .select({
      label: sql<string>`'Number of follows'`,
      value: countDistinct(followTable.follows),
    })
    .from(followTable);

  const noPosts = await ctx.db
    .select({
      label: sql<string>`'Number of posts'`,
      value: count(postTable),
    })
    .from(postTable);

  const noUsers = await ctx.db
    .select({
      label: sql<string>`'Number of users'`,
      value: count(userTable),
    })
    .from(userTable);

  return [...noFollows, ...noPosts, ...noUsers];
}

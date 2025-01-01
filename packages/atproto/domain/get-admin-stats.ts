import { count, countDistinct, sql } from "drizzle-orm";
import type { AtContext } from "../context";
import { postTable } from "./post/post.table";
import { followTable } from "./user/user-follows.table";
import { userTable } from "./user/user.table";

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

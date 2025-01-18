import {
  and,
  count,
  countDistinct,
  eq,
  isNotNull,
  isNull,
  sql,
} from "drizzle-orm";
import type { AtContext } from "../context";
import { postRecords } from "./post/post-record.table";
import { postTexts } from "./post/post-texts.table";
import { postTable } from "./post/post.table";
import { followTable } from "./user/user-follows.table";
import { didTable } from "./user/user.table";

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
      value: count(didTable),
    })
    .from(didTable);

  const noPostsMissingRecords = await ctx.db
    .select({
      label: sql<string>`'Missing records'`,
      value: sql<number>`COALESCE(COUNT(${postTable.id}), 0)`,
    })
    .from(postTable)
    .leftJoin(postRecords, eq(postTable.id, postRecords.postId))
    .where(isNull(postRecords.postId));

  const noPostsMissingText = await ctx.db
    .select({
      label: sql<string>`'Missing text'`,
      value: sql<number>`COALESCE(COUNT(${postTable.id}), 0)`,
    })
    .from(postTable)
    .innerJoin(postRecords, eq(postTable.id, postRecords.postId))
    .leftJoin(postTexts, eq(postTable.id, postTexts.postId))
    .where(and(isNull(postTexts.postId), isNotNull(postRecords.value)));
  return [
    ...noFollows,
    ...noPosts,
    ...noUsers,
    ...noPostsMissingRecords,
    ...noPostsMissingText,
  ];
}

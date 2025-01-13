/*
import { desc } from "drizzle-orm";
import { union } from "drizzle-orm/pg-core";
import type { FeedHandlerArgs } from "..";
import { postTable } from "../../domain/post/post.table";
import { followingPostsQuery } from "./following-posts";
import { followingRepostsQuery } from "./following-reposts";

export function followingAllQuery(args: FeedHandlerArgs) {
  const { ctx, limit = 30, cursor } = args;
  const combinedQuery = union(followingPostsQuery, followingRepostsQuery)
    .limit(limit)
    .orderBy(desc(postTable.lastMentioned));
  return combinedQuery;
}
*/
// TODO: Read up on WITH clause and CTEs

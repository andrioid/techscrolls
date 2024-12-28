import { and, eq, inArray, isNull, lte } from "drizzle-orm";
import type { AtContext } from "../context";
import { postRecords, postTable, postTags } from "../db/schema";

const DAYS_IN_MS = 1000 * 60 * 60 * 24 * 7;

export async function cleanupOldPosts(ctx: AtContext) {
  // Delete anything older than X (currently 3 days)
  const postLifeTime = new Date(new Date().getTime() - (DAYS_IN_MS / 7) * 3);
  // Get all posts that don't have a manual tag
  const res = await ctx.db
    .select({ uri: postTable.id })
    .from(postTable)
    .innerJoin(postRecords, eq(postTable.id, postRecords.postId))
    // This will populate the tags with null for posts that are not manually tagged
    .leftJoin(
      postTags,
      and(eq(postTable.id, postTags.postId), eq(postTags.algo, "manual"))
    )
    .where(and(lte(postTable.created, postLifeTime), isNull(postTags.tagId)));

  console.log(`[cleanup] Deleting ${res.length} old posts`);
  await ctx.db.delete(postTable).where(
    inArray(
      postTable.id,
      res.map((r) => r.uri)
    )
  );
}

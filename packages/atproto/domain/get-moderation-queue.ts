import { desc, eq, isNull } from "drizzle-orm";
import type { AtContext } from "../context";
import { postRecords } from "./post/post-record.table";
import { postScores } from "./post/post-scores.view";
import { postTable } from "./post/post.table";

export async function getModerationPosts(ctx: AtContext) {
  return await ctx.db
    .select({
      postId: postTable.id,
      record: postRecords.value,
    })
    .from(postTable)
    .innerJoin(postRecords, eq(postTable.id, postRecords.postId))
    .leftJoin(postScores, eq(postTable.id, postScores.postId))
    .orderBy(desc(postTable.created))
    .where(isNull(postScores.tagId))
    .limit(25);
}

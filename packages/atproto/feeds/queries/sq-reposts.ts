import { eq } from "drizzle-orm";
import type { FeedHandlerArgs } from "..";
import { repostTable } from "../../domain/post/post-reposts.table";
import { followingSubQuery } from "./sq-following";

// Should show reposts relevant for actor
export function repostSubquery(args: FeedHandlerArgs) {
  const { ctx } = args;
  const fls = followingSubQuery(args);
  const rpls = ctx.db
    .select({
      created: repostTable.created,
      repostAuthor: repostTable.authorId,
      subjectPostUri: repostTable.postId,
      repostUri: repostTable.repostUri,
    })
    .from(repostTable)
    .innerJoin(fls, eq(repostTable.authorId, fls.follows))
    .as("rpls");

  return rpls;
}

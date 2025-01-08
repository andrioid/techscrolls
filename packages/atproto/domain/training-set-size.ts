import { and, eq } from "drizzle-orm";
import type { AtContext } from "../context";
import { postTags } from "./post/post-tag.table";

export async function trainingSetSize(ctx: AtContext) {
  const allTrainingPosts = await ctx.db
    .select({
      postId: postTags.postId,
      tag: postTags.tagId,
      score: postTags.score,
    })
    .from(postTags)
    .where(and(eq(postTags.algo, "manual"), eq(postTags.tagId, "tech")));

  return allTrainingPosts.length;
}

import type { ClassifierTags } from "../classifiers/types";
import type { AtContext } from "../context";
import { postTags, tagTable } from "../db/schema";

export async function classifyPost(
  ctx: AtContext,
  {
    postUri,
    tag,
    score,
    algorithm,
  }: { postUri: string; tag: ClassifierTags; score: number; algorithm: string }
) {
  await ctx.db.transaction(async (tx) => {
    await tx
      .insert(tagTable)
      .values({
        id: tag,
      })
      .onConflictDoNothing();
    await tx
      .insert(postTags)
      .values({
        algo: algorithm,
        postId: postUri,
        score,
        tagId: tag,
      })
      .onConflictDoNothing();
  });
}

import { eq } from "drizzle-orm";
import { gitHubLinkClassifier } from "../classifiers/tech/github-links";
import { mutedWordsClassifier } from "../classifiers/tech/muted-words";
import { techWordsRegExp } from "../classifiers/tech/tech-words";
import type { ClassifierFn } from "../classifiers/types";
import { createAtContext } from "../context";
import { postRecords, postTable, postTags, tagTable } from "../db/schema";

const classifiers: Array<ClassifierFn> = [
  mutedWordsClassifier,
  techWordsRegExp,
  gitHubLinkClassifier,
];

export async function classifier() {
  // 1. Process existing records in batches
  const ctx = await createAtContext();

  const res = await ctx.db
    .select()
    .from(postTable)
    .innerJoin(postRecords, eq(postTable.id, postRecords.postId));
  //.limit(100);

  for (const pr of res) {
    for (const cf of classifiers) {
      const record = pr.post_record.value;
      if (!record) continue;
      const res = await cf({
        ctx,
        post: {
          uri: pr.post.id,
          record: record,
          cid: pr.post_record.cid,
        },
      });
      if (res.score === null) continue;
      await ctx.db.transaction(async (tx) => {
        await tx
          .insert(tagTable)
          .values({
            id: res.tag,
          })
          .onConflictDoNothing();
        await tx
          .insert(postTags)
          .values({
            algo: cf.name,
            postId: pr.post.id,
            score: res.score as number,
            tagId: res.tag,
          })
          .onConflictDoNothing();
      });
    }
  }
  // 2. Listen/Notify from Postgres
}

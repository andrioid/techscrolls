import { and, eq, isNotNull, isNull } from "drizzle-orm";
import type { TaskSpec } from "graphile-worker";
import { createAtContext } from "../../context";
import { extractTextFromPost } from "../../domain/extract-text-from-post";
import { isForeignLanguage } from "../../domain/is-foreign-language";
import { PostFlags } from "../../domain/post/post-flags";
import { postRecords } from "../../domain/post/post-record.table";
import { postTexts } from "../../domain/post/post-texts.table";
import { postTable } from "../../domain/post/post.table";

export type FixMissingTextRecordsType = [
  identifier: "fix-missing-text-records",
  payload: null,
  spec?: TaskSpec
];

export default async function fixMissingTextRecords() {
  const ctx = await createAtContext();
  const missingTextPosts = await ctx.db
    .select({ id: postTable.id, record: postRecords.value })
    .from(postTable)
    .innerJoin(postRecords, eq(postTable.id, postRecords.postId))
    .leftJoin(postTexts, eq(postTable.id, postTexts.postId))
    .where(and(isNull(postTexts.postId), isNotNull(postRecords.value)));
  if (missingTextPosts.length === 0) return;

  console.log(
    `[fix-missing-text-records] Fixing ${missingTextPosts.length} posts`
  );

  for (const mtp of missingTextPosts) {
    if (mtp.record === null) continue;
    const extractedText = await extractTextFromPost(ctx.db, mtp.id, mtp.record);

    if (isForeignLanguage(extractedText.join("\n"))) {
      return;
    }
    let flags: number = 0;
    flags |= PostFlags.Body;
    if (mtp.record.reply) flags |= PostFlags.Replies;

    for (const et of extractedText) {
      await ctx.db
        .insert(postTexts)
        .values({
          postId: mtp.id,
          source: et.type,
          text: et.text,
        })
        .onConflictDoNothing();
    }
  }
}

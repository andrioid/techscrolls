import { subHours } from "date-fns";
import { and, eq, gt } from "drizzle-orm";
import { mutedWordsClassifier } from "../classifiers/tech/muted-words";
import { techLinkClassifier } from "../classifiers/tech/tech-links";
import { techWordsRegExp } from "../classifiers/tech/tech-words";
import { createBayesClassiferFn } from "../classifiers/tfjs";
import type { ClassifierFn } from "../classifiers/types";
import { createAtContext } from "../context";
import { classifyPost } from "../domain/classify-manually";
import { cleanupOldPosts } from "../domain/cleanup-old-posts";
import { postRecords } from "../domain/post/post-record.table";
import { postTags } from "../domain/post/post-tag.table";
import { postTable } from "../domain/post/post.table";

export const LISTEN_NOTIFY_POSTQUEUE = "atproto.postqueue";

export async function classifier() {
  const birthDay = new Date(); // We'll let it rest a bit after a while

  // 1. Process existing records in batches
  const ctx = await createAtContext();
  await cleanupOldPosts(ctx);

  const classifiers: Array<ClassifierFn> = [
    mutedWordsClassifier,
    techWordsRegExp,
    techLinkClassifier,
  ];

  const bayes = await createBayesClassiferFn(ctx);
  if (bayes) classifiers.push(bayes);

  const res = await ctx.db
    .select()
    .from(postTable)
    .innerJoin(postRecords, eq(postTable.id, postRecords.postId))
    .leftJoin(postTags, eq(postTable.id, postTags.postId))
    .where(and(gt(postTable.created, subHours(new Date(), 6))));
  // TODO: Only process unprocessed posts

  console.log("[classifier] processing older posts", res.length);

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
      await classifyPost(ctx, {
        algorithm: cf.name,
        postUri: pr.post.id,
        score: res.score as number,
        tag: res.tag,
      });
    }
  }
  // 2. Listen/Notify from Postgres
  async function handleNewPosts(payload: string) {
    const jsonP = JSON.parse(payload) as { uri: string };
    const t0 = performance.now();

    const [p] = await ctx.db
      .select({
        uri: postTable.id,
        cid: postRecords.cid,
        record: postRecords.value,
      })
      .from(postTable)
      .where(eq(postTable.id, jsonP.uri));

    for (const cf of classifiers) {
      if (!p.record) continue;
      const res = await cf({
        ctx,
        post: {
          uri: p.uri,
          record: p.record,
          cid: p.cid,
        },
      });
      if (res.score === null) continue;
      await classifyPost(ctx, {
        algorithm: cf.name,
        postUri: p.uri,
        score: res.score as number,
        tag: res.tag,
      });
    }
    const t1 = performance.now();

    console.log(`[classifier] ${p.uri} in ${(t1 - t0).toFixed(2)} ms`);
    if (new Date().getTime() - birthDay.getTime() > 2 * 60 * 60 * 1000) {
      // Time to rest. Fly will launch another one.
      process.exit(42);
    }
  }
  console.log("[classifier] listening for new posts...");
  await ctx.db.$client.listen(LISTEN_NOTIFY_POSTQUEUE, handleNewPosts);
}

import { eq, isNull } from "drizzle-orm";
import { mutedWordsClassifier } from "../classifiers/tech/muted-words";
import { techLinkClassifier } from "../classifiers/tech/tech-links";
import { techWordsRegExp } from "../classifiers/tech/tech-words";
import { createBayesClassiferFn } from "../classifiers/tfjs";
import type { ClassifierFn } from "../classifiers/types";
import { createAtContext } from "../context";
import { postRecords, postTable, postTags } from "../db/schema";
import { classifyPost } from "../domain/classify-manually";
import type { FeedPostWithUri } from "../domain/queue-for-classification";

export const LISTEN_NOTIFY_POSTQUEUE = "atproto.postqueue";

export async function classifier() {
  // 1. Process existing records in batches
  const ctx = await createAtContext();
  const classifiers: Array<ClassifierFn> = [
    mutedWordsClassifier,
    techWordsRegExp,
    techLinkClassifier,
    await createBayesClassiferFn(ctx),
  ];

  const res = await ctx.db
    .select()
    .from(postTable)
    .innerJoin(postRecords, eq(postTable.id, postRecords.postId))
    .leftJoin(postTags, eq(postTable.id, postTags.postId))
    .where(isNull(postTags.tagId));
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
  console.log("[classifier] listening for new posts...");
  await ctx.db.$client.listen(LISTEN_NOTIFY_POSTQUEUE, async (payload) => {
    const p = JSON.parse(payload) as FeedPostWithUri;
    const t0 = performance.now();

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
  });
  //while (true) {} // listen doesn't wait
}

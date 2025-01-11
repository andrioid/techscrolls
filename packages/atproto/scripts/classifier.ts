import { and, eq, inArray, isNull } from "drizzle-orm";
import { mutedWordsClassifier } from "../classifiers/tech/muted-words";
import { techLinkClassifier } from "../classifiers/tech/tech-links";
import { techWordsRegExp } from "../classifiers/tech/tech-words";
import { createBayesClassiferFn } from "../classifiers/tfjs";
import type { ClassifierFn } from "../classifiers/types";
import { createAtContext } from "../context";
import { classifyPost } from "../domain/classify-manually";
import { postRecords } from "../domain/post/post-record.table";
import { postTags } from "../domain/post/post-tag.table";

export const LISTEN_NOTIFY_POSTQUEUE = "atproto.postqueue";
const POSTS_PER_CLASSIFIER_RUN = 500;

export async function classifier(postUri?: Array<string>) {
  // 1. Process existing records in batches
  const ctx = await createAtContext();

  const classifiers: Array<ClassifierFn> = [
    mutedWordsClassifier,
    techWordsRegExp,
    techLinkClassifier,
  ];

  // If not enough training data, the bayes classifier is skipped
  const bayes = await createBayesClassiferFn(ctx);
  if (bayes) classifiers.push(bayes);

  for (const classifier of classifiers) {
    if (!classifier.name) {
      console.warn("Classifier has no name, ignoring");
      continue;
    }
    // TODO: Pagination, so we only handle 100 posts at a time
    const unclassifiedPosts = await ctx.db
      .select({
        postId: postRecords.postId,
        record: postRecords.value,
        cid: postRecords.cid,
      })
      .from(postRecords)
      .leftJoin(
        postTags,
        and(
          eq(postRecords.postId, postTags.postId),
          eq(postTags.algo, classifier.name)
        )
      )
      .where(
        and(
          isNull(postTags.postId),
          // If specified, otherwise ignore
          postUri ? inArray(postRecords.postId, postUri) : undefined
        )
      )
      .groupBy(postRecords.postId, postTags.algo);

    console.log(
      `[classifier: ${classifier.name}] ${unclassifiedPosts.length} pending classification`
    );
    if (unclassifiedPosts.length === 0) {
      continue;
    }
    const t0 = performance.now();
    let ignoreCount = 0;
    let classifiedCount = 0;
    for (const pr of unclassifiedPosts) {
      if (!pr.record) continue;
      const res = await classifier({
        ctx,
        post: {
          uri: pr.postId,
          record: pr.record,
          cid: pr.cid,
        },
      });
      if (res.score === null) {
        ignoreCount++;
        continue;
      }
      classifiedCount++;
      await classifyPost(ctx, {
        algorithm: classifier.name,
        postUri: pr.postId,
        score: res.score as number,
        tag: res.tag,
      });
    }
    const t1 = performance.now();
    console.log(
      `[classifier ${
        classifier.name
      }] Classified ${classifiedCount}, ignored ${ignoreCount} in ${(
        t1 - t0
      ).toFixed(2)} ms`
    );
  }
}

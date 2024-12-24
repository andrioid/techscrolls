import { eq } from "drizzle-orm";
import { gitHubLinkClassifier } from "../classifiers/tech/github-links";
import { mutedWordsClassifier } from "../classifiers/tech/muted-words";
import { techWordsRegExp } from "../classifiers/tech/tech-words";
import type { ClassifierFn } from "../classifiers/types";
import { createAtContext } from "../context";
import { postRecords, postTable } from "../db/schema";
import { classifyPost } from "../domain/classify-manually";
import type { FeedPostWithUri } from "../domain/queue-for-classification";

export const LISTEN_NOTIFY_POSTQUEUE = "atproto.postqueue";

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
  // TODO: Only process unprocessed posts

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
    console.log("new post from listen", p.uri);
  });
  //while (true) {} // listen doesn't wait
}

import { desc, eq } from "drizzle-orm";
import { classify } from "../classifiers/tfjs/classify";
import { loadModelFromDb } from "../classifiers/tfjs/loadModelFromDb";
import { createAtContext, type AtContext } from "../context";
import { postRecords, postTable } from "../db/schema";
import type { FeedPostWithUri } from "../domain/queue-for-classification";

async function getAllPostsWithRecords(ctx: AtContext) {
  const res = await ctx.db
    .select({
      uri: postTable.id,
      cid: postRecords.cid,
      value: postRecords.value,
    })
    .from(postTable)
    .innerJoin(postRecords, eq(postTable.id, postRecords.postId))
    .orderBy(desc(postTable.created));

  return res;
}

async function main() {
  const ctx = await createAtContext();
  // TODO: persist https://chatgpt.com/c/676bf1d6-534c-800a-9ed0-3e22823c7c4e
  //const trained = await train(ctx);
  const loaded = await loadModelFromDb(ctx);
  let matchesPerTrained = 0;
  let matchesPerLoaded = 0;
  /*
  await classify(ctx, {
    ...trained,
    onMatch: async (match) => {
      matchesPerTrained++;
    },
  });
  */

  const res = await getAllPostsWithRecords(ctx);
  if (!res) throw new Error("No posts");
  const posts = res
    .filter((p) => !!p.value)
    .map((p) => ({
      cid: p.cid,
      record: p.value,
      uri: p.uri,
    })) as Array<FeedPostWithUri>;

  for (const post of posts) {
    const cl = await classify({
      post,
      ...loaded,
    });
    if (cl) matchesPerLoaded++;
  }

  console.log("Tech matches", matchesPerTrained, matchesPerLoaded);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });

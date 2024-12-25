import { and, desc, eq } from "drizzle-orm";
import { Bayes } from "ts-bayes";
import { createAtContext, type AtContext } from "../context";
import { appData, postRecords, postTable, postTags } from "../db/schema";

async function train(ctx: AtContext) {
  // 1. Fetch all of the manual tags for "tech"
  const res = await ctx.db
    .select()
    .from(postTags)
    .innerJoin(postRecords, eq(postTags.postId, postRecords.postId))
    .where(and(eq(postTags.algo, "manual"), eq(postTags.tagId, "tech")));
  // 2. Feed them into the Baysian class
  const cf = new Bayes();
  for (const ts of res) {
    const text = ts.post_record.value?.text;
    if (!text) continue;
    if (ts.post_tag.score === 100) {
      cf.learn(text, ts.post_tag.tagId);
    } else {
      cf.learn(text, `not:${ts.post_tag.tagId}`);
    }
  }
  // 3. Store the json in app state
  await ctx.db
    .insert(appData)
    .values({
      k: "bayes",
      v: cf.toJson(),
    })
    .onConflictDoUpdate({
      target: appData.k,
      set: {
        v: cf.toJson(),
      },
    });
  return cf;
}

async function main() {
  const ctx = await createAtContext();
  const cf = await train(ctx);

  // 4. Classify posts that don't have a classification and log to console
  const res = await ctx.db
    .select({
      value: postRecords.value,
    })
    .from(postTable)
    .innerJoin(postRecords, eq(postTable.id, postRecords.postId))
    .orderBy(desc(postTable.created))
    .limit(20);
  for (const pr of res) {
    const text = pr.value?.text;
    if (!text) continue;
    if (text.length < 40) continue; // not enough words to matter
    const isTech = cf.categorize(text) == "tech";
    if (!isTech) continue;
    console.log("[tech]", text);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });

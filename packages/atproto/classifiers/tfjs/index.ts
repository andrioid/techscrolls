import { eq } from "drizzle-orm";
import type { AtContext } from "../../context";
import { postTexts } from "../../domain/post/post-texts.table";
import type { FeedPostWithUri } from "../../domain/queue-for-classification";
import type { ClassifierFn } from "../types";
import { classify } from "./classify";
import { isModelOutdated } from "./is-model-outdated";
import { loadModelFromDb } from "./loadModelFromDb";
import { train } from "./train";

type FnType = (ctx: AtContext) => Promise<ClassifierFn>;

export const createBayesClassiferFn: FnType = async (ctx) => {
  // 1. Check if current model is too old
  const isTooOld = await isModelOutdated(ctx);
  const loader = isTooOld ? train : loadModelFromDb;
  const m = await loader(ctx);
  console.log(`[classifier] tfjsbyes ready with ${m.uniqueWords.length} words`);
  // fetch the model and stuff
  return async function tfjsBayes({
    ctx,
    post,
  }: {
    ctx: AtContext;
    post: FeedPostWithUri;
  }) {
    const res = await ctx.db
      .select()
      .from(postTexts)
      .where(eq(postTexts.post_id, post.uri));
    let text = "";
    for (const etext of res) {
      text += `### ${etext.source}\n${etext.text}`;
    }

    const cl = await classify({
      postUri: post.uri,
      text,
      model: m.model,
      uniqueWords: m.uniqueWords,
      wordIndex: m.wordIndex,
    });
    return {
      score: cl?.score ?? null,
      tag: "tech",
    };
  };
};

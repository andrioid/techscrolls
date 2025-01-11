import type { FeedPostWithUri } from "@andrioid/jetstream";
import { eq } from "drizzle-orm";
import type { AtContext } from "../../context";
import {
  embedText,
  type ExtractedText,
} from "../../domain/extract-text-from-post";
import { postTexts } from "../../domain/post/post-texts.table";
import { trainingSetSize } from "../../domain/training-set-size";
import type { ClassifierFn } from "../types";
import { classify } from "./classify";
import { isModelOutdated } from "./is-model-outdated";
import { loadModelFromDb } from "./loadModelFromDb";
import { train } from "./train";

type FnType = (ctx: AtContext) => Promise<ClassifierFn | undefined>;
const MINIMUM_POST_COUNT = 50;

export const createBayesClassiferFn: FnType = async (ctx) => {
  // 1. Check if current model is too old
  const sizeOfSet = await trainingSetSize(ctx);
  if (sizeOfSet < MINIMUM_POST_COUNT) {
    console.log("[classifier] not enough training data, not running tfjsbayes");
    return;
  }
  const loader = (await isModelOutdated(ctx)) ? train : loadModelFromDb;
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
      .select({
        type: postTexts.source,
        text: postTexts.text,
      })
      .from(postTexts)
      .where(eq(postTexts.post_id, post.uri));
    const text = embedText(res satisfies Array<ExtractedText>);

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

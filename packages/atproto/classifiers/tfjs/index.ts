import type { AtContext } from "../../context";
import type { FeedPostWithUri } from "../../domain/queue-for-classification";
import type { ClassifierFn } from "../types";
import { classify } from "./classify";
import { loadModelFromDb } from "./loadModelFromDb";

type FnType = (ctx: AtContext) => Promise<ClassifierFn>;

export const createBayesClassiferFn: FnType = async (ctx) => {
  const m = await loadModelFromDb(ctx);
  // fetch the model and stuff
  return async function tfjsBayes({
    ctx,
    post,
  }: {
    ctx: AtContext;
    post: FeedPostWithUri;
  }) {
    const cl = await classify({
      post: post,
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

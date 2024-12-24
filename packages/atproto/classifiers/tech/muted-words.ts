import type { ClassifierFn } from "../types";

const matcher = new RegExp(/\b(trump|election|government|politics|erotic)\b/i);
export const mutedWordsClassifier: ClassifierFn = async ({ ctx, post }) => {
  let score = null;
  if (matcher.test(post.record.text)) {
    return { score: 0, tag: "tech" };
  }
  return {
    score: null,
    tag: "tech",
  };
};

import type { ClassifierFn } from "../types";

const matcher = new RegExp(
  /\b(typescript|php|c#|refactor|graphql|atproto|in\ code|engineering\ team|tree\ shakable|ISO\ 8601)|algorithms|algorithm\b/i
);

/** Very simple with whitelisted words. Will be replaced later.  */
export const techWordsRegExp: ClassifierFn = async ({ ctx, post }) => {
  let score = null;
  if (matcher.test(post.record.text)) {
    return { score: 85, tag: "tech" };
  }
  return {
    score: null,
    tag: "tech",
  };
};

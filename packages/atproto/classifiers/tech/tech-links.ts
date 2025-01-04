import type { AppBskyEmbedExternal } from "@atproto/api";
import type { ClassifierFn } from "../types";

export const techLinkClassifier: ClassifierFn = async ({ ctx, post }) => {
  if (!post.record.embed?.external) return notInterested;
  const external = post.record.embed?.external as AppBskyEmbedExternal.External;
  if (external.uri.match(techLinkMatcher)) {
    return {
      score: 80,
      tag: "tech",
    };
  }
  // Not interested
  return notInterested;
};

const notInterested = {
  score: null,
  tag: "tech",
} as const;

const techLinkMatcher = new RegExp(
  /^https:\/\/(www\.)?(github\.com|developer\.mozilla.org|stackoverflow\.com|serverfault\.com|superuser\.com|codepen.io|stackblitz.com)/i
);

import type { AppBskyEmbedExternal } from "@atproto/api";
import type { ClassifierFn } from "../types";

export const gitHubLinkClassifier: ClassifierFn = async ({ ctx, post }) => {
  if (!post.record.embed?.external) return notInterested;
  const external = post.record.embed?.external as AppBskyEmbedExternal.External;
  if (external.uri.match(/^https:\/\/(www\.)?github.com/)) {
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

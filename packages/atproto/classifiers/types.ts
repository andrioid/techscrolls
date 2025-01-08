import type { FeedPostWithUri } from "@andrioid/jetstream";
import type { AtContext } from "../context";

export type ClassifierFn = (args: {
  ctx: AtContext;
  post: FeedPostWithUri;
}) => Promise<{
  score: number | null; // null if not interested
  tag: ClassifierTags;
}>;

export type ClassifierTags = "tech";

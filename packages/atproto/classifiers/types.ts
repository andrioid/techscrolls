import type { AtContext } from "../context";
import type { FeedPostWithUri } from "../domain/queue-for-classification";

export type ClassifierFn = (args: {
  ctx: AtContext;
  post: FeedPostWithUri;
}) => Promise<{
  score: number | null; // null if not interested
  tag: ClassifierTags;
}>;

export type ClassifierTags = "tech";

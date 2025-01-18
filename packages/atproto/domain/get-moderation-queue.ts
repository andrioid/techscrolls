import type { FeedHandlerArgs, FeedHandlerOutput } from "../feeds";
import { postQuery } from "../feeds/queries/post-query";

const PER_PAGE = 30;

// TODO: This should in fact follow the same interface as the feed handlers
export async function getModerationPosts(
  args: FeedHandlerArgs
): Promise<FeedHandlerOutput> {
  const { ctx, limit = PER_PAGE, cursor = "0", search, tagFilters } = args;

  const pq = postQuery(args);

  const posts = await pq;

  return {
    feed: posts.map((p) => ({
      post: p.id,
    })),
    cursor: Math.floor(Number(cursor) + Number(limit)).toString(),
  };
}

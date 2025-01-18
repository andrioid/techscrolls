import { type AppBskyFeedGetFeedSkeleton } from "@atproto/api";
import type { FeedHandlerArgs, FeedHandlerOutput } from "..";
import { toCursor } from "../../helpers/cursor";
import { postQuery } from "../queries/post-query";

const PER_PAGE = 30;

// TODO: This should in fact follow the same interface as the feed handlers
export async function trendingAllFeedHandler(
  args: FeedHandlerArgs
): Promise<FeedHandlerOutput> {
  const posts = await postQuery({
    ...args,
    tagFilters: args.tagFilters ?? [
      {
        tag: "tech",
        minScore: 70,
      },
    ],
    options: {
      onlyFollows: false,
    },
  });

  let newCursor: string | undefined;
  if (posts.length > 0) {
    const lastPost = posts[posts.length - 1];
    if (!lastPost.date) {
      throw new Error("wat!");
    }
    newCursor = toCursor(new Date(lastPost.date));
  }

  return {
    feed: posts.map((p) => {
      return {
        post: p.id,
        // No reason given for trending; looks silly
      };
    }),
    cursor: newCursor,
  } satisfies AppBskyFeedGetFeedSkeleton.OutputSchema;
}

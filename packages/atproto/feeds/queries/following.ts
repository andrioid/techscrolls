import { type AppBskyFeedGetFeedSkeleton } from "@atproto/api";
import type { SkeletonReasonRepost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import type { FeedHandlerArgs, FeedHandlerOutput } from "..";
import { toCursor } from "../../helpers/cursor";
import { postQuery } from "./post-query";

const PER_PAGE = 30;

// TODO: This should in fact follow the same interface as the feed handlers
export async function followingFeedHandler(
  args: FeedHandlerArgs
): Promise<FeedHandlerOutput> {
  const posts = await postQuery({
    ...args,
    tagFilters: [
      {
        tag: "tech",
        minScore: 70,
      },
    ],
    options: {
      onlyFollows: true,
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
      let reason: SkeletonReasonRepost | undefined = undefined;
      if (p.repost) {
        // Note: Reason type is required. Client will get mad otherwise
        reason = {
          $type: "app.bsky.feed.defs#skeletonReasonRepost",
          repost: p.repost,
        };
      }
      return {
        post: p.id,
        reason,
      };
    }),
    cursor: newCursor,
  } satisfies AppBskyFeedGetFeedSkeleton.OutputSchema;
}

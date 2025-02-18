import type {
  AppBskyFeedGenerator,
  AppBskyFeedGetFeedSkeleton,
} from "@atproto/api";
import { config } from "../config";
import type { AtContext } from "../context";
import { getModerationPosts } from "../domain/get-moderation-queue";
import type { PostFlags } from "../domain/post/post-flags";
import type { repostTable } from "../domain/post/post-reposts.table";
import type { postTable } from "../domain/post/post.table";
import { followingFeedHandler } from "./handlers/following";
import { repostsOnlyFeedHandler } from "./handlers/only-reposts";
import { trendingAllFeedHandler } from "./handlers/trending-all";

export const DEFAULT_FEED_ACTOR = "did:plc:rrrwbar3wv576qpsymwey5p5";
export type FeedHandlerArgs = {
  ctx: AtContext;
  actorDid: string;
  cursor?: string;
  limit?: number;
  // Additional options for local admin interface and maybe feed settings
  flags?: PostFlags;
  tagFilters?: Array<{
    tag: string;
    minScore?: number;
    maxScore?: number;
  }>;
  options?: {
    onlyFollows?: boolean;
    showPosts?: boolean;
    showReposts?: boolean;
    // posts
    // posts f. follows
    // reposts
    // reposts f. follows
  };
  search?: string;
};

export const FeedDefaultLimit = 30;

export type FeedSQLSelect = {
  id: typeof postTable.id;
  date: typeof postTable.lastMentioned | typeof postTable.created;
  repost: typeof repostTable.repostUri;
};

export type FeedHandlerOutput = AppBskyFeedGetFeedSkeleton.Response["data"];

export type FeedDefinition = {
  rkey: string; // feed-id (affects url)
  record: AppBskyFeedGenerator.Record;
  private: boolean;
  handler: (args: FeedHandlerArgs) => Promise<FeedHandlerOutput>;
};

export const feeds: Array<FeedDefinition> = [
  {
    rkey: "tech-following",
    record: {
      did: config.feedGenDid,
      displayName: "🤖📜 Following",
      description:
        'Your following feed; filtered for anything that isn\'t technical.\n\nMore specifically: Posts, reposts and replies from those you follow if the content has been classified to be "techy" (clinical term) enough by our army of trained robot hamsters.',
      //avatar: avatarRef,
      createdAt: new Date("2024-12-19").toISOString(),
    },
    handler: followingFeedHandler,
    private: false,
  },
  {
    rkey: "tech-all",
    record: {
      did: config.feedGenDid,
      displayName: "🤖📜 Trending",
      description: "Experimental. Algorithms subject to change.",
      //avatar: avatarRef,
      createdAt: new Date("2024-12-19").toISOString(),
    },
    handler: trendingAllFeedHandler,
    private: false,
  },
  {
    rkey: "tech-reposts",
    record: {
      did: config.feedGenDid,
      displayName: "🤖📜 Reposts",
      description: "Experimental. Algorithms subject to change.",
      createdAt: new Date("2025-01-11").toISOString(),
    },
    handler: repostsOnlyFeedHandler,
    private: false,
  },
  {
    rkey: "tech-mod",
    record: {
      did: config.feedGenDid,
      displayName: "🤖📜 Moderator queue",
      description: "Posts that might need classifying",
      createdAt: new Date("2025-01-16").toISOString(),
    },
    handler: getModerationPosts,
    private: true,
  },
];

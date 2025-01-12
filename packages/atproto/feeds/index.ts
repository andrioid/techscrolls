import type {
  AppBskyFeedGenerator,
  AppBskyFeedGetFeedSkeleton,
} from "@atproto/api";
import { config } from "../config";
import type { AtContext } from "../context";
import { getTechAllFeed } from "../domain/get-tech-all-feed";
import { getTechFollowingFeed } from "../domain/get-tech-following-feed";
import type { repostTable } from "../domain/post/post-reposts.table";
import type { postTable } from "../domain/post/post.table";
import { repostsOnlyFeed } from "./only-reposts";

export const DEFAULT_FEED_ACTOR = "did:plc:rrrwbar3wv576qpsymwey5p5";
export type FeedHandlerArgs = {
  ctx: AtContext;
  actorDid: string;
  cursor?: string;
  limit?: number;
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
  handler: (args: FeedHandlerArgs) => Promise<FeedHandlerOutput>;
};

export const feeds: Array<FeedDefinition> = [
  {
    rkey: "tech-following",
    record: {
      did: config.feedGenDid,
      displayName: "Following Tech",
      description:
        "Posts from your following; filtered for anything that isn't considered tech related.",
      //avatar: avatarRef,
      createdAt: new Date("2024-12-19").toISOString(),
    },
    handler: getTechFollowingFeed,
  },
  {
    rkey: "tech-all",
    record: {
      did: config.feedGenDid,
      displayName: "Technical Scrolls",
      description: "Curated tech posts from across the network.",
      //avatar: avatarRef,
      createdAt: new Date("2024-12-19").toISOString(),
    },
    handler: getTechAllFeed,
  },
  {
    rkey: "tech-reposts",
    record: {
      did: config.feedGenDid,
      displayName: "Tech Reposts",
      description: "Experimental",
      createdAt: new Date("2025-01-11").toISOString(),
    },
    handler: repostsOnlyFeed,
  },
];

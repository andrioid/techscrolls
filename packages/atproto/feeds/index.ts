import type { AppBskyFeedGenerator } from "@atproto/api";
import { config } from "../config";
import type { AtContext } from "../context";
import { getTechAllFeed } from "../domain/get-tech-all-feed";
import { getTechFollowingFeed } from "../domain/get-tech-following-feed";

export const DEFAULT_FEED_ACTOR = "did:plc:rrrwbar3wv576qpsymwey5p5";
export type FeedHandlerArgs = {
  ctx: AtContext;
  actorDid: string;
  cursor?: string;
  limit?: number;
};

export type FeedDefinition = {
  rkey: string; // feed-id (affects url)
  record: AppBskyFeedGenerator.Record;
  handler: (args: FeedHandlerArgs) => Promise<Array<string>>;
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
      displayName: "Tech (all)",
      description:
        "Curated tech posts from across the network.\n\nNOTE: Under heavy development and without hosting atm",
      //avatar: avatarRef,
      createdAt: new Date("2024-12-19").toISOString(),
    },
    handler: getTechAllFeed,
  },
];

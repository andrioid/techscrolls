import type {
  AppBskyFeedLike,
  AppBskyFeedPost,
  AppBskyFeedRepost,
  AppBskyGraphFollow,
} from "@atproto/api";

export type SocketEntry = {
  id: string;
  wss: WebSocket;
  args: JetStreamRequest;
  query: string;
};
interface CommitBase {
  collection: string;
  record: unknown;
  cid: string;
  rev: string;
  rkey: string;
  operation: "create" | "delete" | "update";
}
export interface CommitPost extends CommitBase {
  collection: "app.bsky.feed.post";
  record: AppBskyFeedPost.Record;
}
export interface CommitRepost extends CommitBase {
  collection: "app.bsky.feed.repost";
  record: AppBskyFeedRepost.Record;
}
interface CommitLike extends CommitBase {
  collection: "app.bsky.feed.like";
  record: AppBskyFeedLike.Record;
}
interface CommitFollow extends CommitBase {
  collection: "app.bsky.graph.follow";
  record: AppBskyGraphFollow.Record;
}
export type CommitEvent<T extends CommitBase> = {
  did: string;
  time_us: number;
  kind: "commit";
  commit: T;
};
export type CommitTypes = CommitLike | CommitPost | CommitRepost | CommitFollow;
export type JetStreamRequest = {
  wantedCollections?: Readonly<Array<string>>;
  wantedDids?: Readonly<Array<string>>;
  /** Typically the unixtime of the last received post */
  cursor?: Readonly<string>;
};
export type Listener =
  | {
      event: "msg";
      cb: (msg: CommitEvent<CommitTypes>) => Promise<void>;
    }
  | {
      event: "post";
      cb: (msg: FeedPostWithUri) => Promise<void>;
    }
  | {
      event: "repost";
      cb: (msg: CommitEvent<CommitRepost>) => Promise<void>;
    };

export type FeedPostWithUri = {
  uri: string;
  cid: string;
  record: AppBskyFeedPost.Record;
};

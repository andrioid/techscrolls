import type { AppBskyFeedPost } from "@atproto/api";
import zstd from "@bokuweb/zstd-wasm";
import path from "path";
import type { FeedPostWithUri } from "./queue-for-classification";

const zDictionary = Bun.file(path.join(__dirname, "../zstd_dictionary.dat"));

type PostRecord = AppBskyFeedPost.Record & {
  reply?: {
    parent?: {
      cid: string;
      uri: string;
    };
    root?: {
      cid: string;
      uri: string;
    };
  };
};

type StreamCollection = {
  did: string;
  time_us: number;
  kind: "commit";
  commit: {
    cid: string;
    collection: "app.bsky.feed.post";
    rev: string;
    operation: "create";
    rkey: string;
    record: PostRecord;
  };
};

// MAX DIDS defined here: https://github.com/bluesky-social/jetstream/tree/main
export const MAX_DIDS_PER_SOCKET = 10000;
export const JETSTREAM_BASE_URL =
  "wss://jetstream2.us-east.bsky.network/subscribe";

// TODO: Let each listener have id, and cursor. Then persist it
let subscriptions: Array<WebSocket> = [];

export async function createJetStreamListener({
  wantedCollections = ["app.bsky.feed.post"],
  wantedDids = [],
  cursor,
  onPostCreated,
}: {
  wantedCollections?: Array<string>;
  wantedDids?: Array<string>;
  /** Typically the unixtime of the last received post */
  cursor?: string;
  onPostCreated?: (post: FeedPostWithUri) => void;
}) {
  async function init() {
    await zstd.init();
    let remainingDids = wantedDids;
    while (remainingDids.length > 0) {
      const requestDids = remainingDids.splice(
        0,
        remainingDids.length < MAX_DIDS_PER_SOCKET
          ? remainingDids.length
          : MAX_DIDS_PER_SOCKET
      );
      const wcQ = wantedCollections.map((c) => `wantedCollections=${c}`);

      const wdQ = requestDids.map((did) => `wantedDids=${did}`);

      // Requesting everything from the start crashes the socket
      const url = new URL(JETSTREAM_BASE_URL);
      wantedCollections.forEach((wc) => {
        url.searchParams.append("wantedCollections", wc);
      });
      url.searchParams.append("requireHello", "true");
      url.searchParams.append("compress", "true");
      if (cursor) url.searchParams.append("cursor", cursor);

      const query = url.toString();
      console.log(`[JETSTREAM] query (${requestDids.length})`, query);
      const wss = new WebSocket(encodeURI(query));
      wss.addEventListener("message", onMessage);
      wss.addEventListener("open", () => {
        console.log("[jetstream] open - requesting option change");
        wss.send(
          JSON.stringify({
            type: "options_update",
            payload: {
              wantedCollections,
              wantedDids: requestDids,
            },
          })
        );
      });
      wss.addEventListener("close", (ev) => {
        console.log("[jetstream] closed", ev.code, ev.reason, ev.wasClean);
        // TODO: Wait a while, and reconnect
      });
      wss.addEventListener("error", (ev) => {
        console.log("[jetstream] error");
      });

      subscriptions.push(wss);
    }
  }

  async function onMessage(ev: MessageEvent<Buffer>) {
    const dict = zDictionary;
    const uncompressed = zstd.decompressUsingDict(
      zstd.createDCtx(),
      Uint8Array.from(ev.data),
      await dict.bytes()
    );
    const decoder = new TextDecoder();
    const data = JSON.parse(decoder.decode(uncompressed)) as StreamCollection;
    if (
      data.kind === "commit" &&
      data.commit.operation === "create" &&
      data.commit.collection === "app.bsky.feed.post"
    ) {
      onPostCreated?.({
        uri: `at://${data.did}/app.bsky.feed.post/${data.commit.rkey}`,
        record: data.commit.record,
        cid: data.commit.cid,
      });
    }
  }

  await init();
}

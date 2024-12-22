import type { AppBskyFeedPost } from "@atproto/api";
import { Jetstream } from "@skyware/jetstream";
import type { AtContext } from "../context";
import { followTable } from "../db/schema";
import { queueForClassification } from "./queue-for-classification";
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
    collection: "app.bsky.feed.post";
    rev: string;
    operation: "create";
    rkey: string;
    record: PostRecord;
  };
};

export class PostSubscription {
  socket: WebSocket | undefined = undefined;
  jetstream: Jetstream | undefined = undefined;
  ctx: AtContext;
  cursor?: string; // TODO
  constructor(ctx: AtContext) {
    this.ctx = ctx;
  }

  // TODO: Remove or retry. Not possible due to: https://github.com/oven-sh/bun/issues/8721
  public async listenJetstream() {
    const res = await this.insterestingAccounts();
    if (!res) {
      console.warn("No accounts returned, not listening for updates");
      return;
    }
    const wantedDids = res.map((r) => r.did);

    const jetstream = new Jetstream({
      wantedCollections: ["app.bsky.feed.post"],
      wantedDids: wantedDids,
    });

    jetstream.onCreate("app.bsky.feed.post", (event) => {
      console.log(`New post: ${event.commit.record.text}`);
    });
    jetstream.on("error", (err) => {
      console.error(err);
    });
    jetstream.on("close", () => {
      console.log("jetstream closed");
    });

    jetstream.start();

    this.jetstream = jetstream;
  }
  public async listen() {
    const wantedDids = await this.insterestingAccounts();
    if (!wantedDids || wantedDids.length === 0) {
      console.warn("No accounts returned, not listening for updates");
      return;
    }

    const wantedDidsQuery = wantedDids
      .map((r) => `wantedDids=${r.did}`)
      .join("&");

    const url = `wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post&${wantedDidsQuery}`;
    console.log(`Opening wss to: ${url}`);

    const encodedUrl = encodeURI(url);
    const wss = new WebSocket(encodedUrl);
    wss.addEventListener("error", () => {
      console.log("wss error");
    });
    wss.addEventListener("close", (ev) => {
      console.log("wss socket closed", ev.code, ev.reason, ev.wasClean);
    });
    wss.addEventListener("open", () => {
      console.log("wss open");
    });

    wss.addEventListener("message", async (ev) => {
      const raw = ev.data as string;
      const data = JSON.parse(raw) as StreamCollection;
      console.log("message", data.kind, data.did);
      // TODO: Filtering should be done by classifying pipeline
      if (data.commit.operation !== "create") return;
      if (data.commit.collection !== "app.bsky.feed.post") return;
      if (!data.commit.record.langs?.includes("en")) return;
      //if (data.commit.record.reply) return;

      await queueForClassification(this.ctx, {
        createdAt: data.commit.record.createdAt,
        text: data.commit.record.text,
        uri: `at://${data.did}/app.bsky.feed.post/${data.commit.rkey}`,
        authorId: data.did,
      });

      console.log("valid post", data);
    });

    this.socket = wss;
  }

  private async insterestingAccounts() {
    const res = await this.ctx.db
      .selectDistinct({ did: followTable.follows })
      .from(followTable)
      .limit(10); // This shouldn't be necessary!
    return res;
  }
}

// We need a post subscription that stores the cursor and resumes
// If we hit the limit, then repeat until we dont
// Probably need this to monitor likes too

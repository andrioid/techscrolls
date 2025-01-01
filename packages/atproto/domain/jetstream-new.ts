import type { AppBskyFeedPost } from "@atproto/api";
import zstd from "@bokuweb/zstd-wasm";
import fs from "node:fs";
import path from "node:path";
import type { FeedPostWithUri } from "./queue-for-classification";

type SocketEntry = {
  id: string;
  wss: WebSocket;
  args: JetStreamRequest;
  query: string;
};

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

type JetStreamRequest = {
  wantedCollections?: Readonly<Array<string>>;
  wantedDids?: Readonly<Array<string>>;
  /** Typically the unixtime of the last received post */
  cursor?: Readonly<string>;
};

// MAX DIDS defined here: https://github.com/bluesky-social/jetstream/tree/main
const MAX_DIDS_PER_SOCKET = 10000;
const JETSTREAM_BASE_URL = "wss://jetstream2.us-east.bsky.network/subscribe";

export class JetstreamNew {
  private connections: Array<SocketEntry> = [];
  private decoder: TextDecoder = new TextDecoder();
  private zDict: Buffer = fs.readFileSync(
    path.join(__dirname, "../zstd_dictionary.dat")
  );
  private args: JetStreamRequest;
  private listeners: Array<{
    event: "post";
    cb: (msg: FeedPostWithUri) => Promise<void>;
  }> = [];

  private constructor(args: JetStreamRequest) {
    this.args = args;
    this.setupSockets();
  }

  static async Create(args: JetStreamRequest) {
    await zstd.init();
    const instance = new JetstreamNew(args);
    return instance;
  }

  private async decodeMessage(buffer: Buffer) {
    const uncompressed = zstd.decompressUsingDict(
      zstd.createDCtx(),
      Uint8Array.from(buffer),
      Uint8Array.from(this.zDict)
    );

    const data = JSON.parse(
      this.decoder.decode(uncompressed)
    ) as StreamCollection;
    return data;
  }

  /** Go through existing sockets if any and reconfigure
   * - Also creates new sockets if we don't have enough
   */
  public setupSockets(args?: JetStreamRequest) {
    if (args) this.args = args;

    console.log(
      `[jetstream] setting up sockets (${this.args.wantedDids?.length})`
    );

    // 1. Split wantedDids into batches
    let batches: Array<JetStreamRequest> = [];
    let remainingDids = [...(this.args.wantedDids ?? [])];
    while (remainingDids.length > 0) {
      const requestDids = remainingDids.splice(
        0,
        remainingDids.length < MAX_DIDS_PER_SOCKET
          ? remainingDids.length
          : MAX_DIDS_PER_SOCKET
      );
      batches.push({
        wantedDids: requestDids,
      });
    }

    // 2. Iterate over existing connections if any
    this.connections.forEach((connection, idx) => {
      const [args] = batches.splice(0, 1);
      if (args) {
        connection.wss.send(this.getConfigMessage(args));
      } else {
        // No batch found, so ths connection is not needed
        this.connections = this.connections.filter(
          (c) => c.id === connection.id
        );
        connection.wss.close();
      }
    });

    // 3. Create additional connections if needed
    while (batches.length > 0) {
      const [args] = batches.splice(0, 1);
      console.log("Creating socket");
      const query = this.getInitialQuery();
      const wss = new WebSocket(query);

      const socketId = crypto.randomUUID();
      wss.addEventListener("open", (ev) => this.handleOpen(socketId, ev));
      wss.addEventListener("message", (ev) => this.handleMessage(socketId, ev));
      wss.addEventListener("close", (ev) => this.handleClose(socketId, ev));
      this.connections.push({
        id: socketId,
        args,
        wss,
        query,
      });
    }
  }

  private getInitialQuery() {
    const url = new URL(JETSTREAM_BASE_URL);
    const args = this.args;
    url.searchParams.append("requireHello", "true");
    url.searchParams.append("compress", "true");
    return url.toString();
  }

  private getConfigMessage(socketArgs: JetStreamRequest) {
    return JSON.stringify({
      type: "options_update",
      payload: {
        wantedCollections: socketArgs.wantedCollections,
        wantedDids: socketArgs.wantedDids,
      },
    });
  }

  private handleOpen(socketId: string, ev: Event) {
    const connection = this.connections.find((c) => c.id === socketId);
    if (!connection) return;
    console.log(`[jetstream] ${socketId.slice(-6)}: open ${connection.query}`);
    connection.wss.send(this.getConfigMessage(connection.args));
  }

  private async handleMessage(socketId: string, ev: MessageEvent<Buffer>) {
    const msg = await this.decodeMessage(ev.data);
    this.args.cursor = msg.time_us.toString();
    // TODO: Update this.args.cursor so that reconnects dont try to grab everything again
    //console.log(`[jetstream] ${socketId.slice(-6)}: msg`);

    if (
      msg.kind === "commit" &&
      msg.commit.operation === "create" &&
      msg.commit.collection === "app.bsky.feed.post"
    ) {
      for (const listener of this.listeners) {
        await listener.cb({
          uri: `at://${msg.did}/app.bsky.feed.post/${msg.commit.rkey}`,
          record: msg.commit.record,
          cid: msg.commit.cid,
        });
      }
    }
  }

  private handleClose(socketId: string, ev: CloseEvent) {
    console.log(`[jetstream] ${socketId.slice(-6)}: ${ev.reason} ${ev.code}`);
    const connection = this.connections.find((c) => c.id === socketId);
    if (!connection) return; // If not needed anymore, this will return
    const { args } = connection;
    this.connections = this.connections.filter((c) => c.id === socketId);
    setTimeout(() => {
      const newQuery = this.getInitialQuery();
      console.log(
        `[jetstream] ${socketId.slice(-6)}: reconnecting with newQuery`
      );
      const wss = new WebSocket(newQuery);
      const newConnection = {
        id: socketId,
        wss,
        args,
        query: newQuery,
      };
      wss.addEventListener("open", (ev) => this.handleOpen(socketId, ev));
      wss.addEventListener("message", (ev) => this.handleMessage(socketId, ev));
      wss.addEventListener("close", (ev) => this.handleClose(socketId, ev));

      this.connections.push(newConnection);
    }, 30 * 60 * 60 * 1000); // 30 minute cool off
  }

  public on(
    event: (typeof this.listeners)[number]["event"],
    cb: (msg: FeedPostWithUri) => Promise<void>
  ) {
    this.listeners.push({
      event: event,
      cb,
    });
  }
}

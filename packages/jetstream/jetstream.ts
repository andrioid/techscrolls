import type { AppBskyFeedPost } from "@atproto/api";
import { Decoder } from "@toondepauw/node-zstd";
import fs from "node:fs";
import path from "node:path";
import { WebSocket, type RawData } from "ws";
import type {
  CommitEvent,
  CommitPost,
  CommitRepost,
  CommitTypes,
  FeedPostWithUri,
  JetStreamRequest,
  Listener,
  SocketEntry,
} from "./types";

// MAX DIDS defined here: https://github.com/bluesky-social/jetstream/tree/main
const MAX_DIDS_PER_SOCKET = 10000;
const JETSTREAM_BASE_URL = "wss://jetstream2.us-east.bsky.network/subscribe";

export class Jetstream {
  private connections: Array<SocketEntry> = [];
  private decoder = new TextDecoder();
  private zDict = fs.readFileSync(
    path.join(import.meta.dirname, "./zstd_dictionary.dat")
  );
  private args: JetStreamRequest;
  private listeners: Array<Listener> = [];

  private constructor(args: JetStreamRequest) {
    this.args = args;
    this.setupSockets();
  }

  static async Create(args: JetStreamRequest) {
    const instance = new Jetstream(args);
    return instance;
  }

  private async decodeMessage(buffer: Buffer) {
    if (buffer.length === 0) {
      throw new Error("Received an empty buffer");
    }
    const zDecoder = new Decoder(this.zDict);
    const uncompressed = await zDecoder.decode(buffer);
    if (uncompressed.length === 0) throw new Error("Empty message");
    const decoded = this.decoder.decode(uncompressed);

    try {
      const data = JSON.parse(decoded);
      return data as CommitEvent<CommitTypes>;
    } catch (err) {
      console.log("should be json", decoded);
      throw new Error("Failed to parse Jetstream message", {
        cause: err,
      });
    }
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
      wss.on("message", (ev) => this.handleMessage(socketId, ev));
      wss.on("open", () => this.handleOpen(socketId));
      wss.on("message", (ev) => this.handleMessage(socketId, ev));
      wss.on("close", (ev) => this.handleClose(socketId, ev));
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

    if (args.cursor) url.searchParams.append("cursor", args.cursor);
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

  private handleOpen(socketId: string) {
    const connection = this.connections.find((c) => c.id === socketId);
    if (!connection) return;
    console.log(`[jetstream] ${socketId.slice(-6)}: open ${connection.query}`);
    connection.wss.send(this.getConfigMessage(connection.args));
  }

  private async handleMessage(socketId: string, data: RawData) {
    if (!(data instanceof Buffer)) {
      throw new Error("Message is not a buffer");
    }
    const msg = await this.decodeMessage(data);
    this.args.cursor = msg.time_us.toString();
    //console.log(`[jetstream] ${socketId.slice(-6)}: msg`, msg);

    if (msg.kind !== "commit") return; // only kind supported atm
    if (msg.commit.operation !== "create") return;

    switch (msg.commit.collection) {
      case "app.bsky.feed.post":
        //console.log("[jetstream post", msg);
        for (const listener of this.listeners.filter(
          (l) => l.event === "post"
        )) {
          if (!msg.commit.record) {
            console.warn("Received a post event without record");
            continue;
          }
          await listener.cb(msg as CommitEvent<CommitPost>);
        }
        break;
      case "app.bsky.feed.repost":
        //console.log("[jetstream repost]", msg);
        for (const listener of this.listeners.filter(
          (l) => l.event === "repost"
        )) {
          if (!msg.commit.record) {
            console.warn("Received a post event without record");
            continue;
          }
          await listener.cb(msg as CommitEvent<CommitRepost>);
        }
        break;
      default:
        /*
        console.debug(
          `[jetstream] ${msg.commit.operation} "${msg.commit.collection}" ignored`
        );
        */
        break;
    }
  }

  private handleClose(socketId: string, reason: number) {
    console.log(`[jetstream] ${socketId.slice(-6)}: closed ${reason}`);
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
      wss.on("message", (ev) => this.handleMessage(socketId, ev));
      wss.on("open", () => this.handleOpen(socketId));
      wss.on("message", (ev) => this.handleMessage(socketId, ev));
      wss.on("close", (ev) => this.handleClose(socketId, ev));

      this.connections.push(newConnection);
    }, 30 * 60 * 60 * 1000); // 30 minute cool off
  }

  public on(listener: Listener) {
    this.listeners.push(listener);
  }
}

export function toFeedPostWithUri({
  did,
  rkey,
  record,
  cid,
}: {
  record: AppBskyFeedPost.Record;
  rkey: string;
  did: string;
  cid: string;
}): FeedPostWithUri {
  return {
    uri: `at://${did}/app.bsky.feed.post/${rkey}`,
    record,
    cid,
  };
}

import { Jetstream } from "@andrioid/jetstream";
import { desc } from "drizzle-orm";
import type { AtContext } from "../context";
import { postTable } from "./post/post.table";
import { queueForClassification } from "./queue-for-classification";
import { followTable } from "./user/user-follows.table";

export const LISTEN_NOTIFY_NEW_SUBSCRIBERS = "atproto.subscriber.update";

export async function listenForPosts(ctx: AtContext) {
  async function getDids() {
    const wantedDids = await ctx.db
      .selectDistinct({ did: followTable.follows })
      .from(followTable);

    const dids = wantedDids.map((d) => d.did);
    if (dids.length === 0) {
      console.warn("aborting jetstream connection, no dids requested");
      return [];
    }
    return dids;
  }
  const dids = await getDids();

  const latestPost = await ctx.db
    .select()
    .from(postTable)
    .orderBy(desc(postTable.created))
    .limit(1);

  let cursor: string | undefined =
    latestPost.length > 0
      ? Math.floor(new Date(latestPost[0].created).getTime()).toString()
      : undefined;

  const js = await Jetstream.Create({
    wantedDids: dids,
    wantedCollections: ["app.bsky.feed.post", "app.bsky.feed.repost"],
    cursor: cursor?.toString(),
  });
  js.on({
    event: "post",
    cb: async (msg) => {
      await queueForClassification(ctx, msg);
    },
  });
  js.on({
    event: "repost",
    cb: async (msg) => {
      // 1. Classify the referenced post, if not already
      // 2a. Somehow introduce reposts as posts in the table
      // 2b. Introduce a new table and read that too
      // 2c. Ignore the repost all together, but start following the author
    },
  });

  ctx.db.$client.listen(LISTEN_NOTIFY_NEW_SUBSCRIBERS, async () => {
    const newDids = await getDids();
    if (dids.length === newDids.length) {
      console.log("[jetstream] followers changed but same length, ignoring");
      //return;
    }
    console.log("[jetstream] restarting jetstream, new subscribers");
    js.setupSockets({
      wantedDids: dids,
    });
  });
}

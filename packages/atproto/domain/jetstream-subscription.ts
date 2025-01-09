import { Jetstream } from "@andrioid/jetstream";
import { subMinutes } from "date-fns";
import { desc } from "drizzle-orm";
import type { AtContext } from "../context";
import { postTable } from "./post/post.table";
import { queuePost } from "./queue-post";
import { queueRePost } from "./queue-repost";
import { followTable } from "./user/user-follows.table";

export const LISTEN_NOTIFY_NEW_SUBSCRIBERS = "atproto.subscriber.update";

export async function listenForPosts(ctx: AtContext) {
  async function getDids(): Promise<Readonly<Array<string>>> {
    const wantedDids = await ctx.db
      .selectDistinct({ did: followTable.follows })
      .from(followTable);

    const dids = wantedDids.map((d) => d.did);
    if (dids.length === 0) {
      console.warn("aborting jetstream connection, no dids requested");
      return [];
    }
    return [...dids];
  }
  const dids = await getDids();

  const latestPost = await ctx.db
    .select()
    .from(postTable)
    .orderBy(desc(postTable.created))
    .limit(1);

  const cursor: string | undefined =
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
      await queuePost(ctx, msg);
    },
  });
  js.on({
    event: "repost",
    cb: async (msg) => {
      await queueRePost(ctx, msg);
      // 1. Classify the referenced post, if not already
      // 2a. Somehow introduce reposts as posts in the table
      // 2b. Introduce a new table and read that too
      // 2c. Ignore the repost all together, but start following the author
    },
  });

  let lastStarted = new Date();
  ctx.db.$client.listen(LISTEN_NOTIFY_NEW_SUBSCRIBERS, async () => {
    const fifteenMinutesAgo = subMinutes(new Date(), 15);
    if (fifteenMinutesAgo > lastStarted) {
      console.log(
        "[jetstream] ignoring requests to restart, just getting warmed up"
      );
      return;
    }

    const newDids = await getDids();
    console.log("[jetstream] restarting jetstream, new subscribers");
    js.setupSockets({
      wantedDids: newDids,
    });
  });
}

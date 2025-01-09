import { Jetstream } from "@andrioid/jetstream";
import { subMinutes } from "date-fns";
import { desc } from "drizzle-orm";
import type { AtContext } from "../context";
import { getDids } from "./jetstream-did-list";
import { postTable } from "./post/post.table";
import { queuePost } from "./queue-post";
import { queueRePost } from "./queue-repost";

export const LISTEN_NOTIFY_NEW_SUBSCRIBERS = "atproto.subscriber.update";

export async function listenForPosts(ctx: AtContext) {
  const dids = await getDids(ctx);

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

  let postCounter = 0;
  const initialMem = process.memoryUsage().rss;

  js.on({
    event: "post",
    cb: async (msg) => {
      await queuePost(ctx, msg);
      postCounter++;
      const mem = process.memoryUsage().rss;
      console.log(
        `[jetstream] queued ${postCounter}`,
        mem,
        Number((mem / initialMem) * 100).toFixed(2)
      );
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

    const newDids = await getDids(ctx);
    console.log("[jetstream] restarting jetstream, new subscribers");
    js.setupSockets({
      wantedDids: newDids,
    });
  });
}

import {
  Jetstream,
  type CommitEvent,
  type CommitPost,
  type CommitRepost,
} from "@andrioid/jetstream";
import { subMinutes } from "date-fns";
import { desc } from "drizzle-orm";
import type { AtContext } from "../context";
import { hasLabel } from "../helpers/has-label";
import { prettyBytes } from "../helpers/pretty-bytes";
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
      ? Math.floor(
          new Date(latestPost[0].created).getTime() - 1000 * 60 * 5
        ).toString()
      : undefined;

  const js = await Jetstream.Create({
    wantedDids: dids,
    wantedCollections: ["app.bsky.feed.post", "app.bsky.feed.repost"],
    cursor: cursor?.toString(),
  });

  let postCounter = 0;
  const initialMem = process.memoryUsage().rss;

  async function handlePost(msg: CommitEvent<CommitPost>) {
    if (hasLabel(msg.commit.record.labels, ["porn"])) {
      return; // We're not interested in posts with this label
    }
    await queuePost(ctx, msg);
    postCounter++;
    const mem = process.memoryUsage().rss;
    console.log(
      `[jetstream] queued ${new Date(
        msg.commit.record.createdAt
      ).toISOString()} | ${postCounter} ${prettyBytes(mem)} ${Number(
        (mem / initialMem) * 100
      ).toFixed(2)}%`
    );
  }

  async function handleRepost(msg: CommitEvent<CommitRepost>) {
    await queueRePost(ctx, msg);
  }

  async function handleNotify() {
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
  }

  js.on({
    event: "post",
    cb: handlePost,
  });

  js.on({
    event: "repost",
    cb: handleRepost,
  });

  let lastStarted = new Date();
  await ctx.db.$client.listen(LISTEN_NOTIFY_NEW_SUBSCRIBERS, handleNotify);
}

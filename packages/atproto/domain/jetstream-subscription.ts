import {
  Jetstream,
  toFeedPostWithUri,
  type CommitEvent,
  type CommitPost,
  type CommitRepost,
} from "@andrioid/jetstream";
import { subMinutes } from "date-fns";
import { desc } from "drizzle-orm";
import type { AtContext } from "../context";
import { hasLabel } from "../helpers/has-label";
import { addJob } from "../worker/add-job";
import { getDids } from "./jetstream-did-list";
import { postTable } from "./post/post.table";

export const LISTEN_NOTIFY_NEW_SUBSCRIBERS = "atproto.subscriber.update";

export async function listenForPosts(ctx: AtContext) {
  const dids = await getDids(ctx);

  const [latestPost] = await ctx.db
    .select()
    .from(postTable)
    .orderBy(desc(postTable.created))
    .limit(1);

  const cursor: string | undefined = latestPost
    ? subMinutes(new Date(latestPost.created), 5).getTime().toString()
    : undefined;

  const js = await Jetstream.Create({
    wantedDids: dids,
    wantedCollections: ["app.bsky.feed.post", "app.bsky.feed.repost"],
    cursor: cursor?.toString(),
  });

  async function handlePost(msg: CommitEvent<CommitPost>) {
    if (hasLabel(msg.commit.record.labels, ["porn"])) {
      return; // We're not interested in posts with this label
    }
    await addJob(
      "queue-jetstream-post",
      toFeedPostWithUri({
        cid: msg.commit.cid,
        did: msg.did,
        record: msg.commit.record,
        rkey: msg.commit.rkey,
      })
    );
  }

  async function handleRepost(msg: CommitEvent<CommitRepost>) {
    await addJob("queue-jetstream-repost", msg);
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

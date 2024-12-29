import { AtUri } from "@atproto/api";
import { desc } from "drizzle-orm";
import type { AtContext } from "../context";
import { followTable, postTable } from "../db/schema";
import { createJetStreamListener } from "./jetstream";
import {
  queueForClassification,
  type FeedPostWithUri,
} from "./queue-for-classification";

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
      ? Math.floor(new Date(latestPost[0].created).getTime() / 1000).toString()
      : undefined;

  async function handlePostCreated(args: FeedPostWithUri) {
    const atUrl = new AtUri(args.uri);
    cursor = Math.floor(
      new Date(args.record.createdAt).getTime() / 1000
    ).toString();
    await queueForClassification(ctx, args);
  }

  const { updateRequest } = await createJetStreamListener({
    wantedDids: dids,
    onPostCreated: handlePostCreated,
    cursor: cursor?.toString(),
  });

  ctx.db.$client.listen(LISTEN_NOTIFY_NEW_SUBSCRIBERS, async () => {
    const newDids = await getDids();
    if (dids.length === newDids.length) {
      console.log("[jetstream] followers changed but same length, ignoring");
      return;
    }
    console.log("[jetstream] restarting jetstream, new subscribers");
    await updateRequest({
      wantedDids: dids,
      cursor,
    });
  });
}

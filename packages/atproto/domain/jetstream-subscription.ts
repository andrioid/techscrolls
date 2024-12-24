import { AtUri } from "@atproto/api";
import { desc } from "drizzle-orm";
import type { AtContext } from "../context";
import { followTable, postTable } from "../db/schema";
import { createJetStreamListener } from "./jetstream";
import {
  queueForClassification,
  type FeedPostWithUri,
} from "./queue-for-classification";

export async function listenForPosts(ctx: AtContext) {
  const wantedDids = await ctx.db
    .selectDistinct({ did: followTable.follows })
    .from(followTable);

  const dids = wantedDids.map((d) => d.did);
  if (dids.length === 0) {
    console.warn("aborting jetstream connection, no dids requested");
    return;
  }

  const latestPost = await ctx.db
    .select()
    .from(postTable)
    .orderBy(desc(postTable.created))
    .limit(1);

  const cursor =
    latestPost.length > 0
      ? Math.floor(new Date(latestPost[0].created).getTime() / 1000)
      : undefined;

  async function handlePostCreated(args: FeedPostWithUri) {
    const atUrl = new AtUri(args.uri);

    await queueForClassification(ctx, args);
  }

  createJetStreamListener({
    wantedDids: dids,
    onPostCreated: handlePostCreated,
    cursor: cursor?.toString(),
  });
}

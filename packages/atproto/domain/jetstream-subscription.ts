import { AtUri, type AppBskyFeedPost } from "@atproto/api";
import type { AtContext } from "../context";
import { followTable } from "../db/schema";
import { createJetStreamListener } from "./jetstream";
import { queueForClassification } from "./queue-for-classification";

export async function listenForPosts(ctx: AtContext) {
  const wantedDids = await ctx.db
    .selectDistinct({ did: followTable.follows })
    .from(followTable);

  const dids = wantedDids.map((d) => d.did);
  if (dids.length === 0) {
    console.warn("aborting jetstream connection, no dids requested");
    return;
  }

  async function handlePostCreated(
    uri: string,
    postRecord: AppBskyFeedPost.Record
  ) {
    const atUrl = new AtUri(uri);

    await queueForClassification(ctx, { uri, record: postRecord });
  }

  createJetStreamListener({
    wantedDids: dids,
    onPostCreated: handlePostCreated,
  });
}

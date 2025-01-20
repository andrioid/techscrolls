import type { FeedPostWithUri } from "@andrioid/jetstream";
import type { TaskSpec } from "graphile-worker";
import { createAtContext } from "../../context";
import { storePost } from "../../domain/store-post-with-record";

export type QueuePostWithRecordForProcessing = [
  identifier: "queue-jetstream-post",
  payload: FeedPostWithUri,
  spec?: TaskSpec
];

export default async function queueJetStreamPost(
  payload: QueuePostWithRecordForProcessing[1]
) {
  const ctx = await createAtContext();
  await storePost(ctx.db, {
    cid: payload.cid,
    record: payload.record,
    uri: payload.uri,
  });
}

import type { CommitEvent, CommitRepost } from "@andrioid/jetstream";
import type { TaskSpec } from "graphile-worker";
import { createAtContext } from "../../context";
import { queueRePost } from "../../domain/queue-repost";

export type QueueRepostWithRecordForProcessing = [
  identifier: "queue-jetstream-repost",
  payload: CommitEvent<CommitRepost>,
  spec?: TaskSpec
];

export default async function queueJetStreamPost(
  payload: QueueRepostWithRecordForProcessing[1]
) {
  const ctx = await createAtContext();
  await queueRePost(ctx, payload);
}

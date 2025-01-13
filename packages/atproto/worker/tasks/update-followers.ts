import { createAtContext, getOrUpdateFollows } from "@andrioid/atproto";
import type { TaskSpec } from "graphile-worker";

export type UpdateFollowersTaskType = [
  identifier: "update-followers",
  payload: {
    did: string;
  },
  spec?: TaskSpec
];

export default async function updateFollowersTask(
  payload: UpdateFollowersTaskType[1]
) {
  if (!payload.did) {
    console.warn("updateFollowersTask called without valid payload");
    return;
  }
  const ctx = await createAtContext();
  await getOrUpdateFollows(ctx, payload.did);
}

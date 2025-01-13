import { classifier } from "@andrioid/atproto/scripts/classifier";

export default async function classifyPostsTask(
  payload: unknown,
  helpers: unknown
) {
  await classifier();
}

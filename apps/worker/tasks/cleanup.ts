import { createAtContext } from "@andrioid/atproto";
import { cleanupOldPosts } from "@andrioid/atproto/domain/cleanup-old-posts";

export default async function cleanupTask(payload: unknown, helpers: unknown) {
  const ctx = await createAtContext();
  await cleanupOldPosts(ctx);
}

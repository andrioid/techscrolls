import { eq } from "drizzle-orm";
import type { AtContext } from "../context";
import { getAllFollows } from "../helpers/follows";
import { notifyNewSubscribers } from "./notify-new-subscribers";
import { followTable } from "./user/user-follows.table";
import { didTable } from "./user/user.table";

/**
 * Registers the feedUser's followers. Fetches them if necessary.
 * If we already have a list, then we won't update (TODO)
 */
export async function getOrUpdateFollows(
  ctx: AtContext,
  did: string,
  options?: {
    addedBy: string;
  }
) {
  const existingActor = await ctx.db
    .select()
    .from(didTable)
    .where(eq(didTable.did, did));

  if (existingActor.length === 0) {
    console.log("[users] new feed user", did);
    await ctx.db.insert(didTable).values({
      did: did,
      addedBy: options?.addedBy ?? "feed",
    });
  }

  // Allow follower update every 48h
  const isFollowersStale =
    existingActor &&
    new Date().getTime() - existingActor[0]?.modified.getTime() >
      48 * 60 * 60 * 1000;

  if (isFollowersStale) console.log("[user] stale follows", did);

  const existingFollows = await ctx.db
    .select()
    .from(followTable)
    .where(eq(followTable.followedBy, did));
  if (existingFollows.length > 0 && !isFollowersStale) {
    return existingFollows.map((f) => f.follows);
  }
  const follows = await getAllFollows(ctx, did);
  await ctx.db.transaction(async (tx) => {
    await tx.delete(followTable).where(eq(followTable.followedBy, did));
    await tx.insert(followTable).values(
      follows.map((f) => ({
        followedBy: did,
        follows: f.did,
      }))
    );
    await tx
      .update(didTable)
      .set({
        modified: new Date(),
      })
      .where(eq(didTable.did, did));
  });
  await notifyNewSubscribers(ctx);
  return follows.map((f) => f.did);
}

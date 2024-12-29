import { eq } from "drizzle-orm";
import type { AtContext } from "../context";
import { followTable, userTable } from "../db/schema";
import { getAllFollows } from "../helpers/follows";
import { notifyNewSubscribers } from "./notify-new-subscribers";

/**
 * Registers the feedUser's followers. Fetches them if necessary.
 * If we already have a list, then we won't update (TODO)
 */
export async function getOrUpdateFollows(ctx: AtContext, did: string) {
  const existingActor = await ctx.db
    .select()
    .from(userTable)
    .where(eq(userTable.did, did));

  // TODO: Refresh once in a while
  if (existingActor.length === 0) {
    console.log("feed follower does not exist, adding", did);
    await ctx.db.insert(userTable).values({
      did: did,
    });
  }
  //console.log("actor exists", existingActor);

  // Allow follower update every 48h
  const isFollowersStale =
    new Date().getTime() - existingActor[0]?.modified.getTime() >
    48 * 60 * 60 * 1000;

  if (isFollowersStale) console.log("[followers] stale", did);

  const existingFollows = await ctx.db
    .select()
    .from(followTable)
    .where(eq(followTable.followedBy, did));
  if (existingFollows.length > 0 && !isFollowersStale) {
    console.log("[followers] still fresh");
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
      .update(userTable)
      .set({
        modified: new Date(),
      })
      .where(eq(userTable.did, did));
  });
  await notifyNewSubscribers(ctx);
  return follows.map((f) => f.did);
}

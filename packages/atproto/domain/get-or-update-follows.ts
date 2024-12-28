import { eq } from "drizzle-orm";
import type { AtContext } from "../context";
import { followTable, userTable } from "../db/schema";
import { getAllFollows } from "../helpers/follows";
import { LISTEN_NOTIFY_NEW_SUBSCRIBERS } from "./jetstream-subscription";

/**
 * Registers the feedUser's followers. Fetches them if necessary.
 * If we already have a list, then we won't update (TODO)
 */
export async function getOrUpdateFollows(ctx: AtContext, did: string) {
  console.log("getorupdatefollows", did);
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
    ctx.db.$client.notify(LISTEN_NOTIFY_NEW_SUBSCRIBERS, ""); // Tells the queue process
  }
  //console.log("actor exists", existingActor);

  const existingFollows = await ctx.db
    .select()
    .from(followTable)
    .where(eq(followTable.followedBy, did));
  if (existingFollows.length > 0) {
    return existingFollows.map((f) => f.follows);
  }
  const follows = await getAllFollows(ctx, did);
  await ctx.db.insert(followTable).values(
    follows.map((f) => ({
      followedBy: did,
      follows: f.did,
    }))
  );
  return follows.map((f) => f.did);
}

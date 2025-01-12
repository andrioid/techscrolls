import { eq } from "drizzle-orm";
import type { FeedHandlerArgs } from "..";
import { followTable } from "../../domain/user/user-follows.table";

export function followingSubQuery({ ctx, actorDid }: FeedHandlerArgs) {
  return ctx.db
    .select({ follows: followTable.follows })
    .from(followTable)
    .where(eq(followTable.followedBy, actorDid))
    .as("fls");
}

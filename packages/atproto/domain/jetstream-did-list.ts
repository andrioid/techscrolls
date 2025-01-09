import type { AtContext } from "../context";
import { followTable } from "./user/user-follows.table";

export async function getDids(
  ctx: AtContext
): Promise<Readonly<Array<string>>> {
  const wantedDids = await ctx.db
    .selectDistinct({ did: followTable.follows })
    .from(followTable);

  const dids = wantedDids.map((d) => d.did);
  if (dids.length === 0) {
    console.warn("aborting jetstream connection, no dids requested");
    return [];
  }
  return dids;
}

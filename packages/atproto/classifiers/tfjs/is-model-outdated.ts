import { eq } from "drizzle-orm";
import type { AtContext } from "../../context";
import { tfjsModels } from "../../db/schema";

export async function isModelOutdated(ctx: AtContext): Promise<boolean> {
  const res = await ctx.db
    .select({ createdAt: tfjsModels.createdAt })
    .from(tfjsModels)
    .where(eq(tfjsModels.name, "tech"));
  if (!res || res.length === 0) return true;
  const createdAt = res[0].createdAt;
  if (!createdAt) return true;
  // currently half a day while im training, then much higher
  const maxModelLifeTime = new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000);
  if (createdAt < maxModelLifeTime) return true;

  return false;
}

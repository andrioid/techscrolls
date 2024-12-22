import { AppBskyGraphGetFollows } from "@atproto/api";
import type { AtContext } from "../context";

export async function getAllFollows(ctx: AtContext, actor: string) {
  let isDone = false;
  let follows: AppBskyGraphGetFollows.Response["data"]["follows"] = [];
  let currentCursor: string | undefined = undefined;
  while (isDone === false) {
    try {
      const res = (await ctx.atpAgent.app.bsky.graph.getFollows({
        actor,
        limit: 100,
        cursor: currentCursor,
      })) as AppBskyGraphGetFollows.Response; // TODO: cursor breaks the satisfies somehow

      console.log(
        `adding ${res.data.follows.length} ${res.data.cursor} ${currentCursor}`
      );

      follows = [...follows, ...res.data.follows];

      // No cursor, no need to try again
      if (res.data.cursor === undefined || res.data.cursor === currentCursor) {
        isDone = true;
      }
      currentCursor = res.data.cursor;
      Bun.sleep(500); // be nice to the api
    } catch (err) {
      console.log("error from api", err);
      isDone = true;
    }
  }
  return follows;
}

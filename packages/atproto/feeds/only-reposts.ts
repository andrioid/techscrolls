import { getOrUpdateFollows } from "../domain/get-or-update-follows";
import type { FeedHandlerArgs, FeedHandlerOutput } from "../feeds";
import { toCursor } from "../helpers/cursor";
import { followingRepostsQuery } from "./queries/following-reposts";

export async function repostsOnlyFeed(
  args: FeedHandlerArgs
): Promise<FeedHandlerOutput> {
  const { ctx, actorDid, cursor, limit = 50 } = args;

  await getOrUpdateFollows(ctx, actorDid);

  //const posts = await followingRepostsQuery(args);
  const posts = await followingRepostsQuery(args).limit(limit);

  return {
    feed: posts.map((p) => {
      const reason = p.repost
        ? {
            repost: p.repost,
          }
        : undefined;
      return {
        post: p.id,
        reason,
        feedContext: "tech-reposts",
      } satisfies FeedHandlerOutput[number];
    }),
    cursor:
      posts.length > 0 ? toCursor(posts[posts.length - 1].date) : undefined,
  };
}

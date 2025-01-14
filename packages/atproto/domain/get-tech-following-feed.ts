import { AtUri } from "@atproto/api";
import type {
  SkeletonFeedPost,
  SkeletonReasonRepost,
} from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { max } from "drizzle-orm";
import { and, desc, eq, gt, gte } from "drizzle-orm/expressions";
import type { FeedHandlerArgs, FeedHandlerOutput } from "../feeds";
import { fromCursor, toCursor } from "../helpers/cursor";
import { addJob } from "../worker/add-job";
import { repostTable } from "./post/post-reposts.table";
import { postScores } from "./post/post-scores.view";
import { postTable } from "./post/post.table";
import { followTable } from "./user/user-follows.table";

export async function getTechFollowingFeed(
  args: FeedHandlerArgs
): Promise<FeedHandlerOutput> {
  const { ctx, actorDid, cursor, limit = 50 } = args;

  await addJob("update-followers", { did: actorDid });
  //await getOrUpdateFollows(ctx, actorDid);

  const fls = ctx.db
    .select({ follows: followTable.follows })
    .from(followTable)
    .where(eq(followTable.followedBy, actorDid))
    .as("fls");

  const posts = await ctx.db
    .select({
      id: postTable.id,
      repost: repostTable.repostUri,
      date: repostTable.created ?? postTable.created,
    })
    .from(postTable)
    .innerJoin(fls, eq(postTable.authorId, fls.follows))
    .innerJoin(
      postScores,
      and(eq(postScores.postId, postTable.id), eq(postScores.tagId, "tech"))
    )
    .leftJoin(
      repostTable,
      and(
        eq(repostTable.postId, postTable.id),
        cursor ? gt(repostTable.created, fromCursor(cursor)) : undefined
      )
    )
    .where(
      and(
        gte(postScores.avgScore, 70),
        cursor
          ? gt(
              max(repostTable.created) ?? postTable.created,
              fromCursor(cursor)
            )
          : undefined
      )
    )
    .groupBy(postTable.id, repostTable.repostUri)
    .orderBy(desc(repostTable.created), desc(postTable.created))
    .limit(limit);

  return {
    feed: posts.map((p) => {
      let reason: SkeletonReasonRepost | undefined = undefined;
      if (p.repost) {
        const a = new AtUri(p.repost);
        a.collection = "";
        a.rkey = "";
        reason = {
          repost: a.toString(),
        };
      }

      return {
        post: p.id,
        reason,
        feedContext: "tech-following",
      } satisfies SkeletonFeedPost;
    }),
    cursor:
      posts.length > 0 ? toCursor(posts[posts.length - 1].date) : undefined,
  };
}

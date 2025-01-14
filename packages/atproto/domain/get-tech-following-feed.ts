import type {
  SkeletonFeedPost,
  SkeletonReasonRepost,
} from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { max, min } from "drizzle-orm";
import { and, desc, eq, gt, gte, isNotNull, or } from "drizzle-orm/expressions";
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

  const fls = ctx.db
    .select({ follows: followTable.follows })
    .from(followTable)
    .where(eq(followTable.followedBy, actorDid))
    .as("fls");

  const rpls = ctx.db
    .select({
      created: repostTable.created,
      repostAuthor: repostTable.authorId,
      subjectPostUri: repostTable.postId,
      repostUri: repostTable.repostUri,
    })
    .from(repostTable)
    .innerJoin(fls, eq(repostTable.authorId, fls.follows))
    .as("rpls");

  const posts = await ctx.db
    .select({
      id: postTable.id,
      repost: rpls.repostUri,
      date: max(rpls.created) ?? postTable.created,
    })
    .from(postTable)
    .leftJoin(fls, eq(postTable.authorId, fls.follows))
    .leftJoin(rpls, eq(postTable.id, rpls.subjectPostUri))
    .innerJoin(
      postScores,
      and(eq(postScores.postId, postTable.id), eq(postScores.tagId, "tech"))
    )
    .where(
      and(
        or(isNotNull(fls.follows), isNotNull(rpls.subjectPostUri)),
        //isNotNull(rpls.created),
        gte(postScores.avgScore, 70),
        cursor
          ? gt(max(rpls.created) ?? postTable.created, fromCursor(cursor))
          : undefined
      )
    )
    .groupBy(postTable.id, rpls.repostUri)
    .orderBy(desc(min(rpls.created)), desc(postTable.created))
    .limit(limit);

  return {
    feed: posts.map((p) => {
      let reason: SkeletonReasonRepost | undefined = undefined;
      if (p.repost) {
        reason = {
          repost: p.repost,
        };
      }

      return {
        post: p.id,
        reason,
        feedContext: p.repost ? p.repost : "tech-following",
      } satisfies SkeletonFeedPost;
    }),
    cursor:
      posts.length > 0 ? toCursor(posts[posts.length - 1].date) : undefined,
  };
}

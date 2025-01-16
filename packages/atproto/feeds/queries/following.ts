import { and, desc, eq, gt, isNotNull, isNull, or, sql } from "drizzle-orm";
import type { FeedHandlerArgs, FeedHandlerOutput } from "..";
import { postTable } from "../../domain/post/post.table";
import { fromCursor, toCursor } from "../../helpers/cursor";
import { followingSubQuery } from "./sq-following";
import { repostSubquery } from "./sq-reposts";
import { sqScores } from "./sq-scores";

const PER_PAGE = 30;

// TODO: This should in fact follow the same interface as the feed handlers
export async function followingFeedHandler(
  args: FeedHandlerArgs
): Promise<FeedHandlerOutput> {
  const { ctx, limit = PER_PAGE, cursor, search } = args;
  const fls = followingSubQuery(args);
  const rpls = repostSubquery(args);
  const sqs = sqScores(ctx.db);

  const dateField = sql<string>`GREATEST(${rpls.created}, ${postTable.created})`;
  const posts = await ctx.db
    .select({
      id: postTable.id,
      date: dateField,
      repost: rpls.repostUri,
      repostDate: rpls.created,
    })
    .from(postTable)
    .leftJoin(fls, and(eq(fls.follows, postTable.authorId)))
    .leftJoin(rpls, and(eq(rpls.subjectPostUri, postTable.id)))
    .innerJoin(sqs, eq(sqs.postId, postTable.id))
    .where(
      and(
        or(
          // Posts that we follow
          and(isNotNull(fls.follows), isNull(rpls.created)),
          // Reposts by people we follow
          and(isNotNull(rpls.created))
        ),
        cursor ? gt(dateField, fromCursor(cursor)) : undefined
      )
    )
    .orderBy(desc(dateField))
    .limit(limit)
    .groupBy(postTable.id, rpls.created, rpls.repostUri)
    .offset(Number(cursor));

  let newCursor: string | undefined;
  if (posts.length > 0) {
    const lastPost = posts[posts.length - 1];
    if (!lastPost.date) {
      throw new Error("wat!");
    }
    newCursor = toCursor(new Date(lastPost.date));
  }

  return {
    feed: posts.map((p) => ({
      post: p.id,
      //feedContext: p.repostDate ? `${p.repostDate?.toISOString()}` : undefined,
      // reason: p.repost
      //   ? {
      //       repost: p.repost,
      //     }
      //   : undefined,
    })),
    cursor: newCursor,
  };
}

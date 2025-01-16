import { and, desc, eq, isNotNull, isNull, or, sql } from "drizzle-orm";
import type { FeedHandlerArgs, FeedHandlerOutput } from "..";
import { postTable } from "../../domain/post/post.table";
import { followingSubQuery } from "./sq-following";
import { repostSubquery } from "./sq-reposts";
import { sqScores } from "./sq-scores";

const PER_PAGE = 30;

// TODO: This should in fact follow the same interface as the feed handlers
export async function followingFeedHandler(
  args: FeedHandlerArgs
): Promise<FeedHandlerOutput> {
  const { ctx, limit = PER_PAGE, cursor = "0", search } = args;
  const fls = followingSubQuery(args);
  const rpls = repostSubquery(args);
  const sqs = sqScores(ctx.db);

  const posts = await ctx.db
    .select({
      id: postTable.id,
      date: sql<Date>`GREATEST(${rpls.created}, ${postTable.created})`,
      repost: rpls.repostUri,
      repostDate: rpls.created,
    })
    .from(postTable)
    .leftJoin(fls, and(eq(fls.follows, postTable.authorId)))
    .leftJoin(rpls, and(eq(rpls.subjectPostUri, postTable.id)))
    .innerJoin(sqs, eq(sqs.postId, postTable.id))
    .where(
      or(
        // Posts that we follow
        and(isNotNull(fls.follows), isNull(rpls.created)),
        // Reposts by people we follow
        and(isNotNull(rpls.created))
        // TODO: Limit score
      )
    )
    .orderBy(desc(sql<Date>`GREATEST(${rpls.created}, ${postTable.created})`))
    .limit(limit)
    .groupBy(postTable.id, rpls.created, rpls.repostUri)
    .offset(Number(cursor));

  return {
    feed: posts.map((p) => ({
      post: p.id,
      feedContext: p.repostDate ? `${p.repostDate?.toISOString()}` : undefined,
      reason: p.repost
        ? {
            repost: p.repost,
          }
        : undefined,
    })),
    //cursor: Math.floor(Number(cursor) + Number(limit)).toString(),
  };
}

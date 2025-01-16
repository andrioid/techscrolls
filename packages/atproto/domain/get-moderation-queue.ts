import { and, desc } from "drizzle-orm";
import type { FeedHandlerArgs, FeedHandlerOutput } from "../feeds";
import { feedResult } from "../feeds/feed-result";
import { postTable } from "./post/post.table";

const PER_PAGE = 30;

// TODO: This should in fact follow the same interface as the feed handlers
export async function getModerationPosts(
  args: FeedHandlerArgs
): Promise<FeedHandlerOutput> {
  const { ctx, limit = PER_PAGE, cursor = "0", search } = args;

  const posts = await ctx.db
    .select(feedResult)
    .from(postTable)
    //.innerJoin(postTexts, eq(postTable.id, postTexts.post_id))
    //.leftJoin(postScores, eq(postTable.id, postScores.postId))
    .where(and())
    .orderBy(desc(postTable.created))
    .limit(limit)
    .offset(Number(cursor));

  return {
    feed: posts.map((p) => ({
      post: p.id,
    })),
    cursor: Math.floor(Number(cursor) + Number(limit)).toString(),
  };
}

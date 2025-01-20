import {
  and,
  desc,
  eq,
  isNotNull,
  isNull,
  lt,
  or,
  SQL,
  sql,
} from "drizzle-orm";
import type { FeedHandlerArgs } from "..";
import { postTable } from "../../domain/post/post.table";
import { fromCursor } from "../../helpers/cursor";
import { followingSubQuery } from "./sq-following";
import { repostSubquery } from "./sq-reposts";
import { tagScoreSubQuery } from "./sq-scores";
import { textSearchSubQuery } from "./sq-textsearch";

const PER_PAGE = 30;

// TODO: This should in fact follow the same interface as the feed handlers
export async function postQuery(args: FeedHandlerArgs) {
  const {
    ctx,
    limit = PER_PAGE,
    cursor,
    search,
    tagFilters,
    options: options,
  } = args;
  const fls = followingSubQuery(args);
  const rpls = repostSubquery(args);
  const tagScore = tagScoreSubQuery(ctx.db, tagFilters ?? []);
  const textSearch = textSearchSubQuery(ctx.db, search);

  let filters: Array<SQL | undefined> = [
    // Reposts
    options?.showPosts === false ? isNotNull(rpls.created) : undefined,
    options?.showReposts === false ? isNull(rpls.created) : undefined,
    options?.onlyFollows
      ? or(
          // Posts that we follow
          // - Maybe subquery for replies so I can look up the author.. or get PSQL to parse the URL
          and(
            isNull(rpls.created), // Not a repost
            isNotNull(fls.follows),
            // Show only replies if they are replying to someone we follow
            postTable.replyParent
              ? sql`split_part(${postTable.replyParent}, '/', 3) IN (${fls.follows})`
              : undefined
          ),
          // Reposts by people we follow
          and(isNotNull(rpls.created))
        )
      : undefined,
  ];

  const dateField = sql<string>`GREATEST(${rpls.created}, ${postTable.created})`;
  const postQuery = ctx.db
    .select({
      id: postTable.id,
      date: dateField,
      repost: rpls.repostUri,
      repostDate: rpls.created,
    })
    .from(postTable)
    // TODO: If the post is a reply and we don't follow the author (only the replier), skip it
    .leftJoin(fls, and(eq(fls.follows, postTable.authorId)))
    .leftJoin(rpls, and(eq(rpls.subjectPostUri, postTable.id)))
    .innerJoin(tagScore, eq(tagScore.postId, postTable.id))
    .innerJoin(textSearch, eq(postTable.id, textSearch.postId))
    .where(
      and(
        cursor ? lt(dateField, fromCursor(cursor).toISOString()) : undefined,
        ...filters
      )
    )
    .orderBy(desc(dateField))
    .limit(limit)
    .groupBy(postTable.id, rpls.created, rpls.repostUri, postTable.replyRoot);
  return postQuery;
}

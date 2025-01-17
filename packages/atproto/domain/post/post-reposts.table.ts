import { index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { postTable } from "./post.table";

/**
 * Use cases
 * 1. Get a list of posts, with reposts ordered by record creation desc
 */
export const repostTable = pgTable(
  "post_reposts",
  {
    repostUri: text("repost_uri").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => postTable.id, {
        onDelete: "cascade", // delete if post goes away
      }),
    repostAuthorId: text("author_id"),
    created: timestamp({
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("uniq_repost").on(t.postId, t.repostUri),
    index("idx_repost_postid").on(t.postId),
    index("idx_reposts_created").on(t.created),
  ]
);

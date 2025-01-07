import type { AppBskyFeedPost } from "@atproto/api";
import { index, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { postTable } from "./post.table";

// Should be deleted after processing

export const postRecords = pgTable(
  "post_record",
  {
    postId: text("post_id")
      .primaryKey()
      .references(() => postTable.id, { onDelete: "cascade" }),
    type: text().notNull(),
    cid: text().notNull(),
    value: jsonb().$type<AppBskyFeedPost.Record>(),
  },
  (t) => [index("post_idx").on(t.postId)]
);

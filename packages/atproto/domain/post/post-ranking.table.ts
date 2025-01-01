import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { tagTable } from "../tag/tag.table";
import { postTable } from "./post.table";

// Enable algorithms to affect post ranking

export const postRanking = pgTable("post_ranking", {
  postId: text("post_id")
    .notNull()
    .references(() => postTable.id),
  tagId: text("tag_id").references(() => tagTable.id), // optionally relevant to tag,
  score: integer("score").notNull(), // 0-100
  algo: text().notNull(),
});

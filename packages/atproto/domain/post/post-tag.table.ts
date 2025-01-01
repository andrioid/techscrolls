import { index, integer, pgTable, text, unique } from "drizzle-orm/pg-core";
import { tagTable } from "../tag/tag.table";
import { postTable } from "./post.table";

export const postTags = pgTable(
  "post_tag",
  {
    tagId: text("tag_id")
      .notNull()
      .references(() => tagTable.id),
    postId: text("post_id")
      .notNull()
      .references(() => postTable.id, {
        onDelete: "cascade",
      }),
    // Allows an algorithm to give post a relevancy score for tag
    score: integer("score").notNull(), // 0-100

    // popularity should  be in its own table, regardless of algorithms
    //popularity: integer("popularity"),
    algo: text("algo").notNull(),
  },
  (t) => [
    index("tagpost_idx").on(t.postId, t.tagId),
    unique().on(t.algo, t.postId, t.tagId),
  ]
);

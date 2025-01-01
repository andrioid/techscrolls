import { index, pgTable, text, unique } from "drizzle-orm/pg-core";
import { type ExtractedTextType } from "../extract-text-from-post";
import { postTable } from "./post.table";

// For better training, extracted text from images, web-pages or bluesky records can be stored here
// During training, all the text records will be joined as a single string.
export const postTexts = pgTable(
  "post_texts",
  {
    post_id: text("post_id").references(() => postTable.id, {
      onDelete: "cascade",
    }),
    text: text("text").notNull(),
    source: text("source").$type<ExtractedTextType>().notNull(),
  },
  (t) => [
    index("idx_postid").on(t.post_id),
    unique("uniq_post_source").on(t.post_id, t.source),
  ]
);

import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const postTable = pgTable(
  "post",
  {
    id: text().primaryKey(), // bluesky post id
    authorId: text("author_id").notNull(),
    created: timestamp({
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    modified: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("idx_created").on(t.created), // For feed cursor
  ]
);

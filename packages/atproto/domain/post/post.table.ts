import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const postTable = pgTable(
  "post",
  {
    id: text().primaryKey(), // aturi
    authorId: text("author_id").notNull(),
    collection: text("collection").default("app.bsky.feed.post").notNull(),
    flags: integer("flags").notNull().default(0), // See PostFlags
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

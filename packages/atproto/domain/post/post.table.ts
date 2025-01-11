import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const postTable = pgTable(
  "post",
  {
    id: text().primaryKey(), // aturi
    authorId: text("author_id").notNull(),
    flags: integer("flags").notNull().default(0), // See PostFlags
    created: timestamp({
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    modified: timestamp({ withTimezone: true }).defaultNow().notNull(),
    lastMentioned: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("idx_created").on(t.created), // For feed cursor
    index("idx_lastmentioned").on(t.lastMentioned), // For when we want to keep the fresh ones
  ]
);

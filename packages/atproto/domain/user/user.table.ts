import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const userTable = pgTable(
  "user",
  {
    did: text("did").primaryKey(),
    created: timestamp("created", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    modified: timestamp("modified", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  () => []
);

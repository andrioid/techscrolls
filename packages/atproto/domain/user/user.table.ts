import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const didTable = pgTable(
  "did",
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
    addedBy: text("added_by").notNull().default("feed"),
  },
  () => []
);

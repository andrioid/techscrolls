import { index, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { didTable } from "./user.table";

export const followTable = pgTable(
  "did_follow",
  {
    followedBy: text("followed_by")
      .notNull()
      .references(() => didTable.did),
    follows: text("follows").notNull(),
  },
  (t) => [
    primaryKey({
      columns: [t.follows, t.followedBy],
    }),
    index("followedby_idx").on(t.followedBy),
  ]
);

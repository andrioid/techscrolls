import { index, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { userTable } from "./user.table";

export const followTable = pgTable(
  "follow",
  {
    followedBy: text("followed_by")
      .notNull()
      .references(() => userTable.did),
    follows: text("follows").notNull(),
  },
  (t) => [
    primaryKey({
      columns: [t.follows, t.followedBy],
    }),
    index("followedby_idx").on(t.followedBy),
  ]
);

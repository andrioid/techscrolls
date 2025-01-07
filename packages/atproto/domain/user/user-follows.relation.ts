import { relations } from "drizzle-orm";
import { followTable } from "./user-follows.table";
import { didTable } from "./user.table";

export const followTableRelations = relations(followTable, ({ one }) => ({
  follower: one(didTable, {
    fields: [followTable.followedBy],
    references: [didTable.did],
  }),
  follwedBy: one(didTable, {
    fields: [followTable.follows],
    references: [didTable.did],
  }),
}));

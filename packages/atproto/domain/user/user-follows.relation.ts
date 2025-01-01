import { relations } from "drizzle-orm";
import { followTable } from "./user-follows.table";
import { userTable } from "./user.table";

export const followTableRelations = relations(followTable, ({ one }) => ({
  follower: one(userTable, {
    fields: [followTable.followedBy],
    references: [userTable.did],
  }),
  follwedBy: one(userTable, {
    fields: [followTable.follows],
    references: [userTable.did],
  }),
}));

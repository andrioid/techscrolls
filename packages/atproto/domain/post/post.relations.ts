import { relations } from "drizzle-orm";
import { tagTable } from "../tag/tag.table";
import { userTable } from "../user/user.table";
import { postRecords } from "./post-record.table";
import { postTags } from "./post-tag.table";
import { postTable } from "./post.table";

export const postsToTagsRelations = relations(postTags, ({ one }) => ({
  post: one(postTable, {
    fields: [postTags.postId],
    references: [postTable.id],
  }),
  tag: one(tagTable, {
    fields: [postTags.tagId],
    references: [tagTable.id],
  }),
}));

export const postRelations = relations(postTable, ({ one, many }) => ({
  author: one(userTable, {
    fields: [postTable.authorId],
    references: [userTable.did],
  }),
  // TODO: add followedby
  unprocessed: one(postRecords, {
    fields: [postTable.id],
    references: [postRecords.postId],
  }),
  tags: many(postTags),
}));

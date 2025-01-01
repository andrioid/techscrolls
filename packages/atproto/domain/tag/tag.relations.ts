import { relations } from "drizzle-orm";
import { postTags } from "../post/post-tag.table";
import { tagTable } from "./tag.table";

export const tagRelations = relations(tagTable, ({ one, many }) => ({
  posts: many(postTags),
}));

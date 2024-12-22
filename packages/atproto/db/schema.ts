import type { AppBskyFeedPost } from "@atproto/api";
import { relations, sql } from "drizzle-orm";
import {
  index,
  primaryKey,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const appData = sqliteTable(
  "app",
  {
    k: text("k", { enum: ["session"] }).primaryKey(),
    v: text("v", {
      mode: "json",
    }),
  },
  (t) => []
);

export const followTable = sqliteTable(
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

export const postTable = sqliteTable(
  "post",
  {
    id: text().primaryKey(), // bluesky post id
    authorId: text("author_id").notNull(),
    created: text()
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    modified: text()
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  () => []
);

// Should be deleted after processing
export const post_queue = sqliteTable(
  "post_queue",
  {
    postId: text("post_id").primaryKey(),
    type: text({
      enum: ["AppBskyFeedPost.Record"],
    }).notNull(),
    value: text({ mode: "json" }).$type<AppBskyFeedPost.Record>(),
  },
  (t) => [index("post_idx").on(t.postId)]
);

export const tagTable = sqliteTable(
  "tag",
  {
    id: text().primaryKey(),
    description: text(),
  },
  () => []
);

export const postTags = sqliteTable(
  "post_tag",
  {
    tagId: text("tag_id")
      .notNull()
      .references(() => tagTable.id),
    postId: text("post_id")
      .notNull()
      .references(() => postTable.id),
    probability: real(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tagId] })]
);

export const userTable = sqliteTable(
  "user",
  {
    did: text("did").primaryKey(),
    modified: text()
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  () => []
);

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
  unprocessed: one(post_queue, {
    fields: [postTable.id],
    references: [post_queue.postId],
  }),
  tags: many(postTags),
}));

export const tagRelations = relations(tagTable, ({ one, many }) => ({
  posts: many(postTags),
}));

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

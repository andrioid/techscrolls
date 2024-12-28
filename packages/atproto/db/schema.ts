import type { AppBskyFeedPost } from "@atproto/api";
import type * as tf from "@tensorflow/tfjs";
import { relations, sql } from "drizzle-orm";
import {
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  pgView,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { type ClassifierTags } from "../classifiers/types";

export const appData = pgTable(
  "app",
  {
    k: text("k", { enum: ["session", "bayes"] }).primaryKey(),
    v: jsonb("v"),
  },
  (t) => []
);

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

export const postTable = pgTable(
  "post",
  {
    id: text().primaryKey(), // bluesky post id
    authorId: text("author_id").notNull(),
    created: timestamp({
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    modified: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  () => []
);

// Should be deleted after processing
export const postRecords = pgTable(
  "post_record",
  {
    postId: text("post_id")
      .primaryKey()
      .references(() => postTable.id, { onDelete: "cascade" }),
    type: text({
      enum: ["AppBskyFeedPost.Record"],
    }).notNull(),
    cid: text().notNull(),
    value: jsonb().$type<AppBskyFeedPost.Record>(),
  },
  (t) => [index("post_idx").on(t.postId)]
);

export const tagTable = pgTable(
  "tag",
  {
    id: text().primaryKey().$type<ClassifierTags>(),
    description: text(),
  },
  () => []
);

export const postTags = pgTable(
  "post_tag",
  {
    tagId: text("tag_id")
      .notNull()
      .references(() => tagTable.id),
    postId: text("post_id")
      .notNull()
      .references(() => postTable.id, {
        onDelete: "cascade",
      }),
    // Allows an algorithm to give post a relevancy score for tag
    score: integer("score").notNull(), // 0-100
    // popularity should  be in its own table, regardless of algorithms
    //popularity: integer("popularity"),
    algo: text("algo").notNull(),
  },
  (t) => [
    index("tagpost_idx").on(t.postId, t.tagId),
    unique().on(t.algo, t.postId, t.tagId),
  ]
);

// Enable algorithms to affect post ranking
export const postRanking = pgTable("post_ranking", {
  postId: text("post_id")
    .notNull()
    .references(() => postTable.id),
  tagId: text("tag_id").references(() => tagTable.id), // optionally relevant to tag,
  score: integer("score").notNull(), // 0-100
  algo: text().notNull(),
});

export const userTable = pgTable(
  "user",
  {
    did: text("did").primaryKey(),
    modified: text()
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  () => []
);

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const tfjsModels = pgTable("tfjs_model", {
  name: text().notNull().primaryKey(),
  model: jsonb("model_json").notNull().$type<tf.io.ModelJSON>(),
  weights: bytea().notNull(),
  uniqueWords: jsonb("unique_words").notNull().$type<Array<string>>(),
  wordIndex: jsonb("word_index").notNull().$type<Record<string, number>>(),
  createdAt: timestamp("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

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

// Views
export const postScores = pgView("posts_tag_avg").as((qb) => {
  return qb
    .select({
      postId: postTags.postId,
      tagId: postTags.tagId,
      avgScore: sql`round(avg(${postTags.score}), 0)`.as("avg_score"),
      algos: sql`ARRAY_AGG(DISTINCT ${postTags.algo})`.as("algos"),
    })
    .from(postTags)
    .groupBy(sql`${postTags.postId}, ${postTags.tagId}`);
});

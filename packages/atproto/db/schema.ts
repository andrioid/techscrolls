import type * as tf from "@tensorflow/tfjs";
import { sql } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { bytea } from "./custom-types";

export const appData = pgTable(
  "app",
  {
    k: text("k", { enum: ["session", "bayes"] }).primaryKey(),
    v: jsonb("v"),
  },
  (t) => []
);

export const tfjsModels = pgTable("tfjs_model", {
  name: text().notNull().primaryKey(),
  model: jsonb("model_json").notNull().$type<tf.io.ModelJSON>(),
  weights: bytea().notNull(),
  uniqueWords: jsonb("unique_words").notNull().$type<Array<string>>(),
  wordIndex: jsonb("word_index").notNull().$type<Record<string, number>>(),
  createdAt: timestamp("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

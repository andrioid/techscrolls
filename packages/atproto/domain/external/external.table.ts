import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { normalizeUrl } from "../../helpers/normalize-url";

// Mainly so that we're not bombarding the same pages all the time
export const externalTable = pgTable("external", {
  url: text("url").primaryKey(),
  created: timestamp("created", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
  lastCrawled: timestamp("last_crawled", {
    withTimezone: true,
  }),
  markdown: text("markdown").notNull().default(""),
});

export const insertExternal = createInsertSchema(externalTable, {
  url: z.string().transform(normalizeUrl).pipe(z.string().url()),
  // TODO: Filter the markdown
});

import { pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { postTable } from "./post.table";

export const postExternals = pgTable(
  "post_externals",
  {
    url: text("url"),
    postId: text("post_id").references(() => postTable.id),
  },
  (t) => [primaryKey({ columns: [t.postId, t.url] })]
);

import { pgTable, text } from "drizzle-orm/pg-core";
import type { ClassifierTags } from "../../classifiers/types";

export const tagTable = pgTable(
  "tag",
  {
    id: text().primaryKey().$type<ClassifierTags>(),
    description: text(),
  },
  () => []
);

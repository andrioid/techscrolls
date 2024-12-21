import { defineConfig } from "drizzle-kit";
import { config } from "./config";

export default defineConfig({
  dialect: "sqlite",
  schema: "./db/schema.ts",
  out: "./db/drizzle",
  dbCredentials: {
    url: config.sqliteFile,
  },
});

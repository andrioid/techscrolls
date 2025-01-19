import { defineConfig } from "drizzle-kit";
import { config } from "./config";

export default defineConfig({
  dialect: "postgresql",
  schema: [
    "./db/schema.ts",
    "./domain/**/*.{table,view,relations,relation}.ts",
  ],
  out: "./db/drizzle",
  dbCredentials: {
    url: config.pgURL,
  },
});

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: [
    "./db/schema.ts",
    "./domain/**/*.{table,view,relations,relation}.ts",
  ],
  out: "./db/drizzle",
  dbCredentials: {
    url: process.env["PG_URL"] ?? "fail",
  },
});

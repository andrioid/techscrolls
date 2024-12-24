import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/drizzle",
  dbCredentials: {
    url:
      process.env["PG_URL"] ??
      "postgres://devuser:devpass@localhost:5432/devdb",
  },
});

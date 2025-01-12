import { sql, type SQLWrapper } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export const explainAnalyze = async <T extends SQLWrapper>(
  db: PostgresJsDatabase,
  query: T
) => {
  const debugResult = await db.execute(sql`EXPLAIN ANALYZE ${query.getSQL()}`);
  console.debug(debugResult);
  return query;
};

export const debugQuery = async <T extends SQLWrapper>(query: T) => {
  const sql = JSON.stringify(query.getSQL());
  console.debug(`SQL`, sql);
  return query;
};

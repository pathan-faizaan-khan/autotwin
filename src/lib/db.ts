import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Returns the Drizzle client connected to Supabase PostgreSQL.
 * Returns null if DATABASE_URL is not configured (falls back to mock data in API routes).
 */
export function getDb() {
  if (!process.env.DATABASE_URL) return null;
  if (_db) return _db;

  // Use prepare: false for Supabase Transaction Pooler compatibility
  const client = postgres(process.env.DATABASE_URL, { prepare: false });
  _db = drizzle(client, { schema });
  return _db;
}

export type Db = NonNullable<ReturnType<typeof getDb>>;
export { schema };

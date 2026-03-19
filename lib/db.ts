import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/drizzle/schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

// Lazy-initialize so the module can be imported without DATABASE_URL (e.g. Trigger.dev indexer)
let _db: Db | null = null;

function getDb(): Db {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL environment variable is not set");
    const sql = neon(url, { fetchOptions: { cache: "no-store" } });
    _db = drizzle(sql, { schema });
  }
  return _db;
}

export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/drizzle/schema";

// Neon serverless — single connection instance shared across hot-reloads in dev
const sql = neon(process.env.DATABASE_URL!, {
  fetchOptions: { cache: "no-store" },
});

export const db = drizzle(sql, { schema });

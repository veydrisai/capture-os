import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  await sql`DROP TABLE IF EXISTS sessions CASCADE`;
  await sql`DROP TABLE IF EXISTS verification_tokens CASCADE`;

  await sql`
    CREATE TABLE sessions (
      session_token TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires TIMESTAMP NOT NULL
    )
  `;

  await sql`
    CREATE TABLE verification_tokens (
      identifier TEXT NOT NULL,
      token TEXT PRIMARY KEY,
      expires TIMESTAMP NOT NULL
    )
  `;

  console.log("Done — sessions and verification_tokens recreated.");
}

main().catch(console.error);

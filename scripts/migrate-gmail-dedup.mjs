import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

try {
  // Add gmail_message_id column for webhook deduplication
  await sql`
    ALTER TABLE extracted_documents 
    ADD COLUMN IF NOT EXISTS gmail_message_id TEXT UNIQUE
  `;
  console.log("✅ gmail_message_id column added (or already exists).");
} catch (err) {
  console.error("❌ Migration failed:", err.message);
} finally {
  await sql.end();
}

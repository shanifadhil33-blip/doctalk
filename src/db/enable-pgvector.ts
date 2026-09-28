import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env" });

async function enablePgvector() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = neon(process.env.DATABASE_URL);
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;
  console.log("pgvector extension enabled");
}

enablePgvector().catch((error) => {
  console.error(error);
  process.exit(1);
});

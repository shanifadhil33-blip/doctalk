import { readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { demoPdfs } from "../lib/demo/pdf-catalog";
import { embedWithClient, prepareDocumentChunks } from "../lib/documents/ingest";
import { createGeminiEmbeddingClient } from "../lib/embeddings/gemini";
import { chunks, documents, settings } from "./schema";

config({ path: ".env" });

async function seed() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.log(
      "GEMINI_API_KEY is not set. Skipping seed. Set GEMINI_API_KEY to compute embeddings and insert demo documents.",
    );
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);
  const embed = embedWithClient(createGeminiEmbeddingClient({ apiKey }), process.env);

  const existingMode = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "mode"))
    .limit(1);
  if (existingMode.length === 0) {
    await db.insert(settings).values({ key: "mode", value: "demo" });
  }

  let inserted = 0;
  for (const demo of demoPdfs) {
    const existing = await db
      .select({ id: documents.id })
      .from(documents)
      .where(and(eq(documents.isDemo, true), eq(documents.fileName, demo.fileName)))
      .limit(1);
    if (existing.length > 0) {
      console.log(`Demo already seeded: ${demo.fileName}`);
      continue;
    }

    const bytes = new Uint8Array(
      await readFile(path.join(process.cwd(), "public", "demo", demo.diskName)),
    );
    const prepared = await prepareDocumentChunks(bytes, embed);
    const [doc] = await db
      .insert(documents)
      .values({
        fileName: demo.fileName,
        fileUrl: demo.fileUrl,
        isDemo: true,
        status: "ready",
      })
      .returning();
    if (!doc) {
      throw new Error(`Failed to insert ${demo.fileName}`);
    }

    await db.insert(chunks).values(
      prepared.map((piece) => ({
        documentId: doc.id,
        content: piece.content,
        embedding: piece.embedding,
        chunkIndex: piece.chunkIndex,
        page: piece.page,
        metadata: piece.metadata,
      })),
    );
    inserted += 1;
    console.log(`Seeded ${demo.fileName} (${prepared.length} chunks)`);
  }

  console.log(`Seed finished. Inserted ${inserted} demo document(s).`);
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

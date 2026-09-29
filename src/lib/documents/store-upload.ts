import { del, put } from "@vercel/blob";
import { and, count, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { chunks, documents } from "@/db/schema";
import { demoLimitMessage } from "@/lib/ai/limits";
import { embedWithClient, IngestError, prepareDocumentChunks } from "@/lib/documents/ingest";
import { createGeminiEmbeddingClient } from "@/lib/embeddings/gemini";

export async function countOwnedDocuments(userId: string): Promise<number> {
  const [row] = await getDb()
    .select({ value: count() })
    .from(documents)
    .where(and(eq(documents.userId, userId), eq(documents.isDemo, false)));
  const value = Number(row?.value ?? 0);
  return Number.isFinite(value) ? value : 0;
}

export async function removeOwnedDocument(
  userId: string,
  documentId: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const rows = await getDb()
    .select({
      id: documents.id,
      userId: documents.userId,
      isDemo: documents.isDemo,
      fileUrl: documents.fileUrl,
    })
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);
  const row = rows[0];
  if (!row || row.userId !== userId || row.isDemo) {
    return { ok: false, status: 404, error: "Document not found" };
  }

  if (row.fileUrl.startsWith("https://")) {
    const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
    if (!token) {
      return { ok: false, status: 503, error: "File storage is not configured." };
    }
    await del(row.fileUrl, { token });
  }

  await getDb().delete(documents).where(eq(documents.id, documentId));
  return { ok: true };
}

export async function saveUploadedPdf(input: {
  userId: string;
  fileName: string;
  bytes: Uint8Array;
}): Promise<
  | { ok: true; document: { id: string; fileName: string; status: "ready" } }
  | { ok: false; status: number; error: string; documentId?: string }
> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!token) {
    return { ok: false, status: 503, error: "File storage is not configured." };
  }
  if (!apiKey) {
    return { ok: false, status: 503, error: "Embeddings are not configured." };
  }

  const safeUser = input.userId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || "user";
  const blob = await put(
    `uploads/${safeUser}/${crypto.randomUUID()}.pdf`,
    Buffer.from(input.bytes),
    {
      access: "public",
      token,
      contentType: "application/pdf",
      addRandomSuffix: true,
    },
  );

  const db = getDb();
  const inserted = await db
    .insert(documents)
    .values({
      userId: input.userId,
      fileName: input.fileName,
      fileUrl: blob.url,
      isDemo: false,
      status: "processing",
    })
    .returning({ id: documents.id });
  const document = inserted[0];
  if (!document) {
    await del(blob.url, { token });
    return { ok: false, status: 500, error: "Upload failed. Try again later." };
  }

  try {
    const client = createGeminiEmbeddingClient({ apiKey });
    const prepared = await prepareDocumentChunks(
      input.bytes,
      embedWithClient(client, process.env),
    );
    await db.insert(chunks).values(
      prepared.map((piece) => ({
        documentId: document.id,
        content: piece.content,
        embedding: piece.embedding,
        chunkIndex: piece.chunkIndex,
        page: piece.page,
        metadata: piece.metadata,
      })),
    );
    await db
      .update(documents)
      .set({ status: "ready" })
      .where(eq(documents.id, document.id));
    return {
      ok: true,
      document: { id: document.id, fileName: input.fileName, status: "ready" },
    };
  } catch (error) {
    if (demoLimitMessage(error)) {
      await db.delete(documents).where(eq(documents.id, document.id));
      await del(blob.url, { token });
      return {
        ok: false,
        status: 429,
        error: "Demo limit reached, try again later",
      };
    }

    await db
      .update(documents)
      .set({ status: "failed" })
      .where(eq(documents.id, document.id));
    const message =
      error instanceof IngestError
        ? error.message
        : "This document could not be processed.";
    console.error("PDF ingest failed");
    return {
      ok: false,
      status: 422,
      error: message,
      documentId: document.id,
    };
  }
}

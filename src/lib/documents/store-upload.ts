import { del, get } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { chunks, documents } from "@/db/schema";
import { demoLimitMessage } from "@/lib/ai/limits";
import {
  blobBelongsToUpload,
  isRemoteBlobUrl,
  isUploadId,
  isUuid,
} from "@/lib/documents/blob-url";
import {
  decodeMarkdownBytes,
  embedWithClient,
  IngestError,
  prepareDocumentChunks,
  prepareMarkdownChunks,
} from "@/lib/documents/ingest";
import { isMarkdownFileName } from "@/lib/markdown/sections";
import {
  deleteOwnedDocumentRow,
  releasePendingUpload,
} from "@/lib/documents/reserve-slot";
import { hasPdfMagic } from "@/lib/documents/upload-policy";
import { createGeminiEmbeddingClient } from "@/lib/embeddings/gemini";
import { pendingFileUrl } from "@/lib/limits/atomic-count";
import { MAX_PDF_BYTES } from "@/lib/upload-validation";

type StoredDocument = {
  id: string;
  fileName: string;
  status: "ready" | "processing" | "failed";
};

type SaveResult =
  | { ok: true; document: StoredDocument }
  | { ok: false; status: number; error: string; documentId?: string };

export async function removeOwnedDocument(
  userId: string,
  documentId: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (!isUuid(documentId)) {
    return { ok: false, status: 404, error: "Document not found" };
  }

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

  if (isRemoteBlobUrl(row.fileUrl)) {
    const deleted = await deleteBlob(row.fileUrl);
    if (!deleted.ok) return deleted;
  }

  const removed = await deleteOwnedDocumentRow(userId, documentId);
  if (!removed) {
    return { ok: false, status: 404, error: "Document not found" };
  }
  return { ok: true };
}

export async function cancelPendingUpload(
  userId: string,
  uploadId: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (!isUploadId(uploadId)) {
    return { ok: false, status: 400, error: "Invalid request" };
  }
  await releasePendingUpload(userId, uploadId);
  return { ok: true };
}

export async function finishUploadedPdf(input: {
  userId: string;
  uploadId: string;
  url: string;
  pathname: string;
}): Promise<SaveResult> {
  if (!isUploadId(input.uploadId) || !blobBelongsToUpload(input)) {
    return { ok: false, status: 400, error: "Invalid request" };
  }

  const token = blobToken();
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!token) {
    return { ok: false, status: 503, error: "File storage is not configured." };
  }
  if (!apiKey) {
    return { ok: false, status: 503, error: "Embeddings are not configured." };
  }

  const pendingUrl = pendingFileUrl(input.uploadId);
  const db = getDb();
  const claimed = await db
    .update(documents)
    .set({ fileUrl: input.url })
    .where(
      and(
        eq(documents.userId, input.userId),
        eq(documents.fileUrl, pendingUrl),
        eq(documents.isDemo, false),
        eq(documents.status, "processing"),
      ),
    )
    .returning({ id: documents.id, fileName: documents.fileName });

  const claimedRow = claimed[0];
  if (!claimedRow) {
    return existingUploadResult(input.userId, input.url);
  }

  try {
    const bytes = await readPrivatePdf(input.url, token);
    const markdown = isMarkdownFileName(claimedRow.fileName);
    if (markdown && (hasPdfMagic(bytes) || bytes.includes(0))) {
      await discardUpload(input.userId, claimedRow.id, input.url, token);
      return { ok: false, status: 400, error: "That file is not a Markdown file." };
    }
    if (!markdown && !hasPdfMagic(bytes)) {
      await discardUpload(input.userId, claimedRow.id, input.url, token);
      return { ok: false, status: 400, error: "That file is not a PDF." };
    }

    const client = createGeminiEmbeddingClient({ apiKey });
    const embed = embedWithClient(client, process.env);
    const prepared = markdown
      ? await prepareMarkdownChunks(decodeMarkdownBytes(bytes), embed)
      : await prepareDocumentChunks(bytes, embed);
    await db.insert(chunks).values(
      prepared.map((piece) => ({
        documentId: claimedRow.id,
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
      .where(eq(documents.id, claimedRow.id));
    return {
      ok: true,
      document: {
        id: claimedRow.id,
        fileName: claimedRow.fileName,
        status: "ready",
      },
    };
  } catch (error) {
    const tooLarge =
      error instanceof IngestError && error.message === "PDF must be 10 MB or smaller.";
    const notMarkdown =
      error instanceof IngestError && error.message === "That file is not a Markdown file.";
    if (demoLimitMessage(error) || tooLarge || notMarkdown) {
      await discardUpload(input.userId, claimedRow.id, input.url, token);
      if (demoLimitMessage(error)) {
        return {
          ok: false,
          status: 429,
          error: "Demo limit reached, try again later",
        };
      }
      return {
        ok: false,
        status: 400,
        error: tooLarge ? "PDF must be 10 MB or smaller." : "That file is not a Markdown file.",
      };
    }

    await db
      .update(documents)
      .set({ status: "failed" })
      .where(eq(documents.id, claimedRow.id));
    const message =
      error instanceof IngestError
        ? error.message
        : "This document could not be processed.";
    console.error("PDF ingest failed");
    return {
      ok: false,
      status: 422,
      error: message,
      documentId: claimedRow.id,
    };
  }
}

async function existingUploadResult(userId: string, fileUrl: string): Promise<SaveResult> {
  const rows = await getDb()
    .select({
      id: documents.id,
      fileName: documents.fileName,
      status: documents.status,
    })
    .from(documents)
    .where(
      and(
        eq(documents.userId, userId),
        eq(documents.fileUrl, fileUrl),
        eq(documents.isDemo, false),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) {
    return { ok: false, status: 404, error: "Document not found" };
  }
  if (row.status === "ready") {
    return {
      ok: true,
      document: { id: row.id, fileName: row.fileName, status: "ready" },
    };
  }
  if (row.status === "failed") {
    return {
      ok: false,
      status: 422,
      error: "This document could not be processed.",
      documentId: row.id,
    };
  }
  return { ok: false, status: 409, error: "This document is still processing." };
}

export async function retryFailedDocument(
  userId: string,
  documentId: string,
): Promise<SaveResult> {
  if (!isUuid(documentId)) {
    return { ok: false, status: 404, error: "Document not found" };
  }

  const token = blobToken();
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!token) {
    return { ok: false, status: 503, error: "File storage is not configured." };
  }
  if (!apiKey) {
    return { ok: false, status: 503, error: "Embeddings are not configured." };
  }

  const db = getDb();
  const claimed = await db
    .update(documents)
    .set({ status: "processing" })
    .where(
      and(
        eq(documents.id, documentId),
        eq(documents.userId, userId),
        eq(documents.isDemo, false),
        eq(documents.status, "failed"),
      ),
    )
    .returning({
      id: documents.id,
      fileName: documents.fileName,
      fileUrl: documents.fileUrl,
    });
  const row = claimed[0];
  if (!row || !isRemoteBlobUrl(row.fileUrl)) {
    const current = await db
      .select({
        id: documents.id,
        fileName: documents.fileName,
        status: documents.status,
        userId: documents.userId,
        isDemo: documents.isDemo,
      })
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);
    const existing = current[0];
    if (!existing || existing.userId !== userId || existing.isDemo) {
      return { ok: false, status: 404, error: "Document not found" };
    }
    if (existing.status === "ready") {
      return {
        ok: true,
        document: { id: existing.id, fileName: existing.fileName, status: "ready" },
      };
    }
    if (existing.status === "processing") {
      return { ok: false, status: 409, error: "This document is still processing." };
    }
    return {
      ok: false,
      status: 422,
      error: "This document could not be processed.",
      documentId,
    };
  }

  try {
    const bytes = await readPrivatePdf(row.fileUrl, token);
    const markdown = isMarkdownFileName(row.fileName);
    const client = createGeminiEmbeddingClient({ apiKey });
    const embed = embedWithClient(client, process.env);
    const prepared = markdown
      ? await prepareMarkdownChunks(decodeMarkdownBytes(bytes), embed)
      : await prepareDocumentChunks(bytes, embed);
    await db.delete(chunks).where(eq(chunks.documentId, row.id));
    await db.insert(chunks).values(
      prepared.map((piece) => ({
        documentId: row.id,
        content: piece.content,
        embedding: piece.embedding,
        chunkIndex: piece.chunkIndex,
        page: piece.page,
        metadata: piece.metadata,
      })),
    );
    await db.update(documents).set({ status: "ready" }).where(eq(documents.id, row.id));
    return {
      ok: true,
      document: { id: row.id, fileName: row.fileName, status: "ready" },
    };
  } catch (error) {
    await db.update(documents).set({ status: "failed" }).where(eq(documents.id, row.id));
    const message =
      error instanceof IngestError ? error.message : "This document could not be processed.";
    console.error("PDF ingest failed");
    return { ok: false, status: 422, error: message, documentId: row.id };
  }
}

async function discardUpload(
  userId: string,
  documentId: string,
  fileUrl: string,
  token: string,
): Promise<void> {
  await del(fileUrl, { token }).catch(() => {
    console.error("Blob delete failed");
  });
  await deleteOwnedDocumentRow(userId, documentId);
}

async function deleteBlob(
  fileUrl: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const token = blobToken();
  if (!token) {
    return { ok: false, status: 503, error: "File storage is not configured." };
  }
  await del(fileUrl, { token });
  return { ok: true };
}

export async function readPrivatePdf(url: string, token: string): Promise<Uint8Array> {
  const result = await get(url, { access: "private", token });
  if (!result || result.statusCode !== 200 || !result.stream) {
    throw new IngestError("This document could not be processed.");
  }
  if (typeof result.blob.size === "number" && result.blob.size > MAX_PDF_BYTES) {
    await result.stream.cancel().catch(() => undefined);
    throw new IngestError("PDF must be 10 MB or smaller.");
  }
  return readLimitedStream(result.stream, MAX_PDF_BYTES);
}

async function readLimitedStream(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number,
): Promise<Uint8Array> {
  const reader = stream.getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        throw new IngestError("PDF must be 10 MB or smaller.");
      }
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.byteLength;
  }
  return bytes;
}

function blobToken(): string | null {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  return token ? token : null;
}

import { and, asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { chunks } from "@/db/schema";
import { EMBEDDING_DIMENSIONS } from "@/lib/embeddings/embed";
import { MAX_INGEST_CHUNKS } from "@/lib/pdf/chunk";
import {
  labelFromChunk,
  pageNumberFromChunk,
  type Passage,
} from "@/lib/retrieval/answer";
import { choosePassages, documentFitsInPrompt } from "@/lib/retrieval/passage-selection";

export const RETRIEVAL_TOP_K = 5;

/**
 * Cosine top-k over one document. `<=>` is the pgvector cosine operator, which
 * the HNSW index `chunks_embedding_hnsw_idx` (vector_cosine_ops) supports.
 */
export async function searchDocumentChunks(
  documentId: string,
  embedding: readonly number[],
  limit = RETRIEVAL_TOP_K,
): Promise<Passage[]> {
  if (
    embedding.length !== EMBEDDING_DIMENSIONS ||
    embedding.some((value) => !Number.isFinite(value))
  ) {
    throw new Error(`Expected a ${EMBEDDING_DIMENSIONS} dimension embedding`);
  }

  const literal = JSON.stringify(embedding);
  const rows = await getDb()
    .select({
      content: chunks.content,
      page: chunks.page,
      metadata: chunks.metadata,
    })
    .from(chunks)
    .where(and(eq(chunks.documentId, documentId), sql`${chunks.embedding} IS NOT NULL`))
    .orderBy(sql`${chunks.embedding} <=> ${literal}::vector`)
    .limit(limit);

  return rows.map((row) => passageFromRow(row));
}

/** Opening passages in document order, for a summary of the whole file. */
export async function loadDocumentPassages(
  documentId: string,
  limit = 8,
): Promise<Passage[]> {
  const rows = await getDb()
    .select({
      content: chunks.content,
      page: chunks.page,
      metadata: chunks.metadata,
    })
    .from(chunks)
    .where(eq(chunks.documentId, documentId))
    .orderBy(asc(chunks.chunkIndex))
    .limit(limit);

  return rows.map((row) => passageFromRow(row));
}

/**
 * A short file is read in full. A long file uses vector search, and still
 * keeps a heading the question names even when that heading is not a near neighbor.
 */
export async function passagesForAsk(
  documentId: string,
  question: string,
  embedQuestion: () => Promise<readonly number[]>,
): Promise<Passage[]> {
  const ordered = await loadDocumentPassages(documentId, MAX_INGEST_CHUNKS);
  if (documentFitsInPrompt(ordered)) return ordered;
  const hits = await searchDocumentChunks(documentId, await embedQuestion());
  return choosePassages(ordered, question, hits);
}

function passageFromRow(row: {
  content: string;
  page: number | null;
  metadata: unknown;
}): Passage {
  const label = labelFromChunk(row);
  return {
    page: pageNumberFromChunk(row),
    content: row.content,
    ...(label ? { label } : {}),
  };
}

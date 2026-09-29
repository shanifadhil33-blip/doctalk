import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { chunks } from "@/db/schema";
import { EMBEDDING_DIMENSIONS } from "@/lib/embeddings/embed";
import {
  pageNumberFromChunk,
  type Passage,
} from "@/lib/retrieval/answer";

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

  return rows.map((row) => ({
    page: pageNumberFromChunk(row),
    content: row.content,
  }));
}

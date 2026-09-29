import { embedTexts } from "@/lib/embeddings/batch";
import {
  embeddingModelFromEnv,
  type EmbeddingClient,
} from "@/lib/embeddings/embed";
import { chunkPages, MAX_INGEST_CHUNKS } from "@/lib/pdf/chunk";
import { parsePdfPages } from "@/lib/pdf/parse";

export class IngestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IngestError";
  }
}

export type PreparedChunk = {
  content: string;
  page: number;
  chunkIndex: number;
  embedding: number[];
  metadata: { pageNumber: number };
};

export async function prepareDocumentChunks(
  bytes: Uint8Array,
  embed: (texts: readonly string[]) => Promise<number[][]>,
): Promise<PreparedChunk[]> {
  const pages = await parsePdfPages(bytes);
  const pieces = chunkPages(pages);
  if (pieces.length === 0) {
    throw new IngestError("No text found in this PDF.");
  }
  if (pieces.length > MAX_INGEST_CHUNKS) {
    throw new IngestError("This PDF has too much text to process.");
  }

  const embeddings = await embed(pieces.map((piece) => piece.content));
  return pieces.map((piece, index) => {
    const embedding = embeddings[index];
    if (!embedding) {
      throw new IngestError("Missing embedding for a passage.");
    }
    return {
      content: piece.content,
      page: piece.page,
      chunkIndex: piece.chunkIndex,
      embedding,
      metadata: { pageNumber: piece.page },
    };
  });
}

export function embedWithClient(client: EmbeddingClient, env: NodeJS.ProcessEnv) {
  const model = embeddingModelFromEnv(env);
  return (texts: readonly string[]) => embedTexts(texts, client, model);
}

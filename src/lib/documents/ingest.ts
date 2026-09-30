import { embedTexts } from "@/lib/embeddings/batch";
import {
  embeddingModelFromEnv,
  type EmbeddingClient,
} from "@/lib/embeddings/embed";
import { parseMarkdownSections } from "@/lib/markdown/sections";
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
  metadata: { pageNumber: number } | { heading: string };
};

export function decodeMarkdownBytes(bytes: Uint8Array): string {
  if (bytes.includes(0)) {
    throw new IngestError("That file is not a Markdown file.");
  }
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (!text.trim()) {
      throw new IngestError("No text found in this file.");
    }
    return text;
  } catch (error) {
    if (error instanceof IngestError) throw error;
    throw new IngestError("That file is not a Markdown file.");
  }
}

export async function prepareMarkdownChunks(
  text: string,
  embed: (texts: readonly string[]) => Promise<number[][]>,
): Promise<PreparedChunk[]> {
  const sections = parseMarkdownSections(text);
  const pieces = chunkPages(
    sections.map((section) => ({ page: section.index, text: section.text })),
  );
  if (pieces.length === 0) {
    throw new IngestError("No text found in this file.");
  }
  if (pieces.length > MAX_INGEST_CHUNKS) {
    throw new IngestError("This file has too much text to process.");
  }

  const headingForSection = new Map(sections.map((section) => [section.index, section.heading]));
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
      metadata: { heading: headingForSection.get(piece.page) ?? "Introduction" },
    };
  });
}

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

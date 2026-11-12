export const DEFAULT_CHUNK_CHARS = 1200;
export const DEFAULT_CHUNK_OVERLAP = 150;
export const MAX_INGEST_CHUNKS = 100;

export type PageText = {
  page: number;
  text: string;
};

export type TextChunk = {
  content: string;
  page: number;
  chunkIndex: number;
};

export function chunkPages(
  pages: readonly PageText[],
  options?: { maxChars?: number; overlap?: number },
): TextChunk[] {
  const maxChars = options?.maxChars ?? DEFAULT_CHUNK_CHARS;
  const overlap = Math.min(options?.overlap ?? DEFAULT_CHUNK_OVERLAP, maxChars - 1);
  const chunks: TextChunk[] = [];

  for (const page of pages) {
    const text = page.text.replace(/\s+/g, " ").trim();
    if (!text) continue;

    let start = 0;
    while (start < text.length) {
      let end = Math.min(text.length, start + maxChars);
      if (end < text.length) {
        const space = text.lastIndexOf(" ", end);
        if (space > start + Math.floor(maxChars / 2)) {
          end = space;
        }
      }

      const content = text.slice(start, end).trim();
      if (content) {
        chunks.push({
          content,
          page: page.page,
          chunkIndex: chunks.length,
        });
      }

      if (end >= text.length) break;
      let next = end - overlap;
      // Start the overlap on a whole word, not partway through one.
      if (next > 0 && text[next - 1] !== " ") {
        const space = text.indexOf(" ", next);
        next = space > 0 && space < end ? space + 1 : next;
      }
      start = next > start ? next : end;
    }
  }

  return chunks;
}

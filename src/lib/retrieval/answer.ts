export const NOT_IN_DOCUMENT_ANSWER = "That is not in this document.";

export type Passage = {
  page: number;
  content: string;
};

export type RetrievalCitation = {
  page: number;
  excerpt: string;
};

const EXCERPT_CHARS = 400;

export function buildRetrievalPrompt(
  question: string,
  passages: readonly Passage[],
): string {
  const blocks = passages
    .map(
      (passage, index) =>
        `[${index + 1}] page ${passage.page}\n${passage.content}`,
    )
    .join("\n\n");

  return [
    "Answer the question using only the passages below.",
    "Cite page numbers like (p. N).",
    `If the passages do not contain the answer, reply with exactly: ${NOT_IN_DOCUMENT_ANSWER}`,
    "Do not use outside knowledge.",
    "",
    `Question: ${question}`,
    "",
    "Passages:",
    blocks,
  ].join("\n");
}

export function citationsFromPassages(
  passages: readonly Passage[],
): RetrievalCitation[] {
  return passages.map((passage) => ({
    page: passage.page,
    excerpt: excerpt(passage.content),
  }));
}

export function isNotInDocumentAnswer(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  const expected = NOT_IN_DOCUMENT_ANSWER.toLowerCase();
  return normalized === expected || normalized.startsWith(`${expected}`);
}

export function finalizeAnswer(
  modelText: string,
  passages: readonly Passage[],
): { answer: string; citations: RetrievalCitation[] } {
  if (passages.length === 0 || isNotInDocumentAnswer(modelText)) {
    return { answer: NOT_IN_DOCUMENT_ANSWER, citations: [] };
  }
  const answer = modelText.trim();
  if (!answer) {
    return { answer: NOT_IN_DOCUMENT_ANSWER, citations: [] };
  }
  return { answer, citations: citationsFromPassages(passages) };
}

export async function answerFromPassages(
  question: string,
  passages: readonly Passage[],
  complete: (prompt: string) => Promise<string>,
): Promise<{ answer: string; citations: RetrievalCitation[] }> {
  if (passages.length === 0) {
    return { answer: NOT_IN_DOCUMENT_ANSWER, citations: [] };
  }
  const text = await complete(buildRetrievalPrompt(question, passages));
  return finalizeAnswer(text, passages);
}

export function pageNumberFromChunk(row: {
  page: number | null;
  metadata: unknown;
}): number {
  if (typeof row.page === "number" && Number.isInteger(row.page) && row.page > 0) {
    return row.page;
  }
  if (row.metadata && typeof row.metadata === "object" && "pageNumber" in row.metadata) {
    const value = row.metadata.pageNumber;
    if (typeof value === "number" && Number.isInteger(value) && value > 0) {
      return value;
    }
  }
  return 1;
}

function excerpt(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= EXCERPT_CHARS) return trimmed;
  return `${trimmed.slice(0, EXCERPT_CHARS).trim()}...`;
}

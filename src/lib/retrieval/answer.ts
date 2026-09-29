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
    "Answer the question using only the numbered passages below.",
    'Return JSON only: {"answer":"your answer","used":[1,3]}',
    "used lists the passage numbers that support the answer, in the order you used them.",
    "Do not put those numbers in the answer text.",
    `If the passages do not contain the answer, set answer to exactly: ${NOT_IN_DOCUMENT_ANSWER}`,
    "and set used to [].",
    "Do not use outside knowledge.",
    "",
    `Question: ${question}`,
    "",
    "Passages:",
    blocks,
  ].join("\n");
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
  if (passages.length === 0) {
    return { answer: NOT_IN_DOCUMENT_ANSWER, citations: [] };
  }

  const parsed = parseModelReply(modelText);
  const used = parsed.used ?? passageIdsInOrder(parsed.answer);
  const answer = stripPassageMarkers(parsed.answer);

  if (!answer || isNotInDocumentAnswer(answer)) {
    return { answer: NOT_IN_DOCUMENT_ANSWER, citations: [] };
  }

  return { answer, citations: citationsForUsed(passages, used) };
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

function parseModelReply(raw: string): { answer: string; used: number[] | null } {
  const text = unwrapFence(raw);
  const payload = extractAnswerPayload(text);
  if (payload) return payload;
  return { answer: text, used: null };
}

function unwrapFence(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractAnswerPayload(
  text: string,
): { answer: string; used: number[] | null } | null {
  let searchFrom = 0;
  while (searchFrom < text.length) {
    const start = text.indexOf("{", searchFrom);
    if (start < 0) return null;
    const region = balancedObject(text, start);
    if (!region) return null;
    const payload = payloadFromJson(region.json);
    if (payload) return payload;
    searchFrom = region.end;
  }
  return null;
}

function balancedObject(
  text: string,
  start: number,
): { json: string; end: number } | null {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return { json: text.slice(start, index + 1), end: index + 1 };
      }
    }
  }

  return null;
}

function payloadFromJson(
  json: string,
): { answer: string; used: number[] | null } | null {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    return null;
  }
  if (!isRecord(value) || typeof value.answer !== "string") return null;
  return { answer: value.answer, used: readUsed(value.used) };
}

function readUsed(value: unknown): number[] | null {
  if (value === undefined) return null;
  if (typeof value === "number") return [value];
  if (typeof value === "string") return passageIdsInOrder(`[${value}]`);
  if (!Array.isArray(value)) return [];

  const ids: number[] = [];
  for (const item of value) {
    if (typeof item === "number" && Number.isInteger(item)) {
      ids.push(item);
      continue;
    }
    if (typeof item === "string" && /^\d+$/.test(item.trim())) {
      ids.push(Number(item.trim()));
    }
  }
  return ids;
}

function passageIdsInOrder(text: string): number[] {
  const ids: number[] = [];
  for (const match of text.matchAll(/\[\s*(\d+(?:\s*,\s*\d+)*)\s*\]/g)) {
    const body = match[1];
    if (!body) continue;
    for (const part of body.split(",")) {
      const id = Number(part.trim());
      if (Number.isInteger(id)) ids.push(id);
    }
  }
  return ids;
}

function stripPassageMarkers(text: string): string {
  const without = text.replace(
    /(?:\bused\s*:\s*)?\[\s*\d+(?:\s*,\s*\d+)*\s*\]/gi,
    "",
  );
  return without
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([.,;:!?])/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function citationsForUsed(
  passages: readonly Passage[],
  used: readonly number[],
): RetrievalCitation[] {
  const seenPages = new Set<number>();
  const citations: RetrievalCitation[] = [];

  for (const id of used) {
    if (!Number.isInteger(id) || id < 1 || id > passages.length) continue;
    const passage = passages[id - 1];
    if (!passage || seenPages.has(passage.page)) continue;
    seenPages.add(passage.page);
    citations.push({
      page: passage.page,
      excerpt: excerpt(passage.content),
    });
  }

  return citations;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function excerpt(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= EXCERPT_CHARS) return trimmed;
  return `${trimmed.slice(0, EXCERPT_CHARS).trim()}...`;
}

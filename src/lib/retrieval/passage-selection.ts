import type { Passage } from "@/lib/retrieval/answer";

/** A note of several screens fits in one prompt. Larger files still search. */
export const FULL_DOCUMENT_CHAR_BUDGET = 80_000;

const NUMBERED_REFERENCE =
  /\b(?:point|section|item|step|part|heading|number)\s+#?(\d{1,3})\b|#(\d{1,3})\b/gi;

const TOKEN_STOP = new Set([
  "this",
  "that",
  "with",
  "from",
  "what",
  "when",
  "where",
  "which",
  "about",
  "point",
  "section",
  "item",
  "step",
  "part",
  "heading",
  "number",
  "document",
  "does",
  "have",
  "into",
  "your",
  "their",
]);

export function documentFitsInPrompt(
  passages: readonly Passage[],
  budget = FULL_DOCUMENT_CHAR_BUDGET,
): boolean {
  if (passages.length === 0) return true;
  let total = 0;
  for (const passage of passages) total += passage.content.length;
  return total <= budget;
}

/**
 * Small documents are sent in full, in reading order, so a numbered heading
 * is not dropped by a vector lookup. Large documents keep vector hits plus
 * any passage whose heading is the number or whose text contains the question.
 */
export function choosePassages(
  ordered: readonly Passage[],
  question: string,
  vectorHits: readonly Passage[],
  budget = FULL_DOCUMENT_CHAR_BUDGET,
): Passage[] {
  if (ordered.length > 0 && documentFitsInPrompt(ordered, budget)) {
    return [...ordered];
  }
  return mergePassages(ordered.filter((passage) => passageMatchesQuestion(passage, question)), vectorHits);
}

export function numberedRefs(question: string): number[] {
  const found: number[] = [];
  for (const match of question.matchAll(NUMBERED_REFERENCE)) {
    const raw = match[1] ?? match[2];
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 1 || value > 999) continue;
    if (!found.includes(value)) found.push(value);
  }
  return found;
}

export function startsWithNumber(value: string, number: number): boolean {
  const text = value.trim();
  if (!text) return false;
  const pattern = new RegExp(
    `^(?:point\\s+|section\\s+|item\\s+|step\\s+|part\\s+|#)?${number}(?:\\b|[.):\\s-])`,
    "i",
  );
  return pattern.test(text);
}

export function passageMatchesQuestion(passage: Passage, question: string): boolean {
  const numbers = numberedRefs(question);
  if (numbers.some((number) => passageHasNumber(passage, number))) return true;
  const tokens = questionTokens(question);
  if (tokens.length === 0) return false;
  const haystack = `${passage.label ?? ""} ${passage.content}`.toLowerCase();
  return tokens.some((token) => haystack.includes(token));
}

function passageHasNumber(passage: Passage, number: number): boolean {
  if (passage.label && startsWithNumber(passage.label, number)) return true;
  return startsWithNumber(passage.content, number);
}

function questionTokens(question: string): string[] {
  const tokens: string[] = [];
  for (const part of question.toLowerCase().split(/[^a-z0-9]+/)) {
    if (part.length < 4 || TOKEN_STOP.has(part)) continue;
    if (!tokens.includes(part)) tokens.push(part);
  }
  return tokens;
}

function mergePassages(preferred: readonly Passage[], extra: readonly Passage[]): Passage[] {
  const merged: Passage[] = [];
  const seen = new Set<string>();
  for (const passage of [...preferred, ...extra]) {
    const key = `${passage.page}\u0000${passage.label ?? ""}\u0000${passage.content.slice(0, 120)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(passage);
    if (merged.length >= 16) break;
  }
  return merged;
}

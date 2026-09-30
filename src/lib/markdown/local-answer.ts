import { parseMarkdownSections, type MarkdownSection } from "@/lib/markdown/sections";
import { NOT_IN_DOCUMENT_ANSWER } from "@/lib/retrieval/answer";
import { numberedRefs, startsWithNumber } from "@/lib/retrieval/passage-selection";

export type LocalMarkdownCitation = {
  page: number;
  excerpt: string;
  label: string;
};

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "of",
  "to",
  "and",
  "or",
  "for",
  "in",
  "on",
  "at",
  "what",
  "who",
  "when",
  "where",
  "how",
  "does",
  "do",
  "did",
  "this",
  "that",
  "note",
  "document",
  "about",
  "from",
  "with",
  "are",
  "was",
  "be",
  "it",
  "its",
]);

/** Answer from the note's own sections. A miss cites nothing. */
export function answerMarkdownLocally(
  source: string,
  question: string,
): { answer: string; citations: LocalMarkdownCitation[] } {
  const sections = parseMarkdownSections(source);
  if (sections.length === 0) {
    return { answer: NOT_IN_DOCUMENT_ANSWER, citations: [] };
  }

  const numbers = numberedRefs(question);
  if (numbers.length > 0) {
    const numbered = sectionForNumber(sections, numbers);
    if (!numbered) return { answer: NOT_IN_DOCUMENT_ANSWER, citations: [] };
    return answerFromSection(numbered);
  }

  const tokens = questionTokens(question);
  if (tokens.length === 0) {
    return { answer: NOT_IN_DOCUMENT_ANSWER, citations: [] };
  }

  let best: { score: number; index: number } | null = null;
  for (const section of sections) {
    const haystack = section.text.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (haystack.includes(token)) score += token.length;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { score, index: section.index };
    }
  }

  const chosen = sections.find((section) => section.index === best?.index);
  if (!best || !chosen) {
    return { answer: NOT_IN_DOCUMENT_ANSWER, citations: [] };
  }

  const excerpt = excerptFrom(chosen.text);
  return {
    answer: excerpt,
    citations: [{ page: chosen.index, excerpt, label: chosen.heading }],
  };
}

function sectionForNumber(
  sections: readonly MarkdownSection[],
  numbers: readonly number[],
): MarkdownSection | null {
  return (
    sections.find((section) =>
      numbers.some(
        (number) => startsWithNumber(section.heading, number) || startsWithNumber(section.text, number),
      ),
    ) ?? null
  );
}

function answerFromSection(section: MarkdownSection): {
  answer: string;
  citations: LocalMarkdownCitation[];
} {
  const excerpt = excerptFrom(section.text);
  return {
    answer: excerpt,
    citations: [{ page: section.index, excerpt, label: section.heading }],
  };
}

function questionTokens(question: string): string[] {
  const parts = question.toLowerCase().split(/[^a-z0-9.]+/);
  const tokens: string[] = [];
  for (const part of parts) {
    if (part.length < 3 || STOP_WORDS.has(part)) continue;
    tokens.push(part);
  }
  return tokens;
}

function excerptFrom(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= 420) return flat;
  const slice = flat.slice(0, 420);
  const space = slice.lastIndexOf(" ");
  return `${(space > 80 ? slice.slice(0, space) : slice).trim()}...`;
}

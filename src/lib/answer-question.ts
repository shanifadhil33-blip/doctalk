import type { Citation, DemoDocument } from "@/lib/document-types";

export function answerQuestion(
  document: DemoDocument,
  question: string,
): { answer: string; citations: Citation[] } | null {
  const normalized = question.trim().toLowerCase();
  if (!normalized) return null;

  let best: { score: number; answer: string; citations: Citation[] } | null =
    null;

  for (const item of document.answers) {
    let score = 0;
    for (const keyword of item.keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        score += keyword.length;
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { score, answer: item.answer, citations: item.citations };
    }
  }

  if (!best) return null;
  return { answer: best.answer, citations: best.citations };
}

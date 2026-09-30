import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { questions } from "@/db/schema";

const QUESTION_HISTORY_LIMIT = 30;

export type AskedQuestion = {
  id: string;
  documentId: string | null;
  documentTitle: string;
  question: string;
  answer: string;
  askedOn: string;
  askedLabel: string;
};

export function formatAskedAt(date: Date): { askedOn: string; askedLabel: string } {
  const askedOn = date.toISOString().slice(0, 10);
  const askedLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  return { askedOn, askedLabel };
}

export function documentTitleFromFileName(fileName: string): string {
  const trimmed = fileName.trim();
  const withoutExtension = trimmed.replace(/\.(pdf|markdown|md)$/i, "");
  return withoutExtension.length > 0 ? withoutExtension : trimmed;
}

/** Saves a signed-in question. A missing table does not fail the answer. */
export async function recordAskedQuestion(input: {
  userId: string;
  documentId: string | null;
  documentTitle: string;
  question: string;
  answer: string;
}): Promise<void> {
  if (!process.env.DATABASE_URL) return;

  try {
    await getDb().insert(questions).values({
      userId: input.userId,
      documentId: input.documentId,
      documentTitle: input.documentTitle,
      question: input.question,
      answer: input.answer,
    });
  } catch (error) {
    console.error(
      "Could not save question",
      error instanceof Error ? error.message : "unknown",
    );
  }
}

/** Latest questions for this account. Empty when the database is not ready. */
export async function loadAskedQuestions(userId: string): Promise<AskedQuestion[]> {
  if (!process.env.DATABASE_URL) return [];

  try {
    const rows = await getDb()
      .select({
        id: questions.id,
        documentId: questions.documentId,
        documentTitle: questions.documentTitle,
        question: questions.question,
        answer: questions.answer,
        createdAt: questions.createdAt,
      })
      .from(questions)
      .where(eq(questions.userId, userId))
      .orderBy(desc(questions.createdAt))
      .limit(QUESTION_HISTORY_LIMIT);

    return rows.map((row) => {
      const { askedOn, askedLabel } = formatAskedAt(row.createdAt);
      return {
        id: row.id,
        documentId: row.documentId,
        documentTitle: row.documentTitle,
        question: row.question,
        answer: row.answer,
        askedOn,
        askedLabel,
      };
    });
  } catch (error) {
    console.error(
      "Could not load questions",
      error instanceof Error ? error.message : "unknown",
    );
    return [];
  }
}

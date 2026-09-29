import { ChatConfigError, completePrompt } from "@/lib/ai/chat";
import { demoLimitMessage } from "@/lib/ai/limits";
import { decideDocumentAccess } from "@/lib/auth/access";
import { takeDemoQuestionSlot } from "@/lib/demo/quota-store";
import { lookupDocument } from "@/lib/documents/lookup";
import { embedText, embeddingModelFromEnv } from "@/lib/embeddings/embed";
import { createGeminiEmbeddingClient } from "@/lib/embeddings/gemini";
import {
  answerFromPassages,
  type RetrievalCitation,
} from "@/lib/retrieval/answer";
import { searchDocumentChunks } from "@/lib/retrieval/search";

const QUESTION_MAX = 2000;

export type AskResult =
  | { status: 200; body: { answer: string; citations: RetrievalCitation[] } }
  | { status: number; body: { error: string } };

export async function askDocument(input: {
  viewerUserId: string | null;
  documentId: string;
  question: string;
  ip: string;
  now: Date;
  env?: NodeJS.ProcessEnv;
}): Promise<AskResult> {
  const env = input.env ?? process.env;
  const question = input.question.trim();
  if (!question) {
    return { status: 400, body: { error: "Enter a question." } };
  }
  if (question.length > QUESTION_MAX) {
    return { status: 400, body: { error: "That question is too long." } };
  }
  if (!env.DATABASE_URL) {
    return { status: 503, body: { error: "Database is not configured" } };
  }

  const lookup = await lookupDocument(input.documentId);
  const decision = decideDocumentAccess(input.viewerUserId, lookup);
  if (decision === "sign-in") {
    return { status: 401, body: { error: "Sign in required" } };
  }
  if (decision !== "allow" || lookup.status !== "found") {
    return { status: 404, body: { error: "Document not found" } };
  }

  const status = lookup.document.status ?? "ready";
  if (status === "processing") {
    return { status: 409, body: { error: "This document is still processing." } };
  }
  if (status === "failed") {
    return { status: 409, body: { error: "This document could not be processed." } };
  }

  if (!input.viewerUserId) {
    const allowed = await takeDemoQuestionSlot(input.ip, input.now);
    if (!allowed) {
      return { status: 429, body: { error: "Demo limit reached, try again later" } };
    }
  }

  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return { status: 503, body: { error: "Chat is not configured" } };
  }

  try {
    const client = createGeminiEmbeddingClient({ apiKey });
    const embedding = await embedText(question, client, embeddingModelFromEnv(env));
    const passages = await searchDocumentChunks(input.documentId, embedding);
    const result = await answerFromPassages(question, passages, (prompt) =>
      completePrompt(env, prompt),
    );
    return { status: 200, body: result };
  } catch (error) {
    if (error instanceof ChatConfigError) {
      return { status: 503, body: { error: error.message } };
    }
    if (demoLimitMessage(error)) {
      return { status: 429, body: { error: "Demo limit reached, try again later" } };
    }
    console.error("Chat request failed");
    return { status: 500, body: { error: "Chat failed. Try again later." } };
  }
}

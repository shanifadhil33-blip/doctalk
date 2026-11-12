import { ChatConfigError, ChatTimeoutError, completePrompt } from "@/lib/ai/chat";
import { demoLimitMessage } from "@/lib/ai/limits";
import { decideDocumentAccess } from "@/lib/auth/access";
import {
  DEMO_MARKDOWN_FILE,
  DEMO_MARKDOWN_TITLE,
  isDemoMarkdownId,
} from "@/lib/demo/markdown-catalog";
import { passagesForMarkdownFile } from "@/lib/demo/markdown-passages";
import { passagesForDemoFile } from "@/lib/demo/pdf-catalog";
import { takeDemoQuestionSlot } from "@/lib/demo/quota-store";
import { lookupDocument } from "@/lib/documents/lookup";
import { embedText, embeddingModelFromEnv } from "@/lib/embeddings/embed";
import { createGeminiEmbeddingClient } from "@/lib/embeddings/gemini";
import {
  answerFromPassages,
  type RetrievalCitation,
} from "@/lib/retrieval/answer";
import { documentTitleFromFileName, recordAskedQuestion } from "@/lib/questions/history";
import { passagesForAsk } from "@/lib/retrieval/search";

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

  if (isDemoMarkdownId(input.documentId)) {
    return answerDemoMarkdown(input, env);
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
      return { status: 429, body: { error: "Demo limit reached, try again later." } };
    }
  }

  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return { status: 503, body: { error: "Chat is not configured" } };
  }

  const timer = stageTimer(lookup.document.isDemo ? "demo" : "upload");
  try {
    const demoPassages = lookup.document.isDemo
      ? passagesForDemoFile(lookup.document.fileName) ??
        passagesForMarkdownFile(lookup.document.fileName)
      : null;
    const passages = demoPassages
      ? demoPassages
      : await passagesForAsk(input.documentId, question, () =>
          embedText(
            question,
            createGeminiEmbeddingClient({ apiKey }),
            embeddingModelFromEnv(env),
          ),
        );
    timer.mark("passages", passages);
    const result = await answerFromPassages(question, passages, (prompt) =>
      completePrompt(env, prompt),
    );
    timer.mark("model");
    if (input.viewerUserId) {
      await saveWithin(
        recordAskedQuestion({
          userId: input.viewerUserId,
          documentId: input.documentId,
          documentTitle: documentTitleFromFileName(lookup.document.fileName),
          question,
          answer: result.answer,
        }),
      );
      timer.mark("save");
    }
    timer.done("ok");
    return { status: 200, body: result };
  } catch (error) {
    return chatFailure(error, timer);
  }
}

/** History is a convenience. It must never hold an answer back. */
const SAVE_TIMEOUT_MS = 3_000;

async function saveWithin(save: Promise<void>): Promise<void> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    save,
    new Promise<void>((resolve) => {
      timeout = setTimeout(() => {
        console.error("Saving the question took too long");
        resolve();
      }, SAVE_TIMEOUT_MS);
    }),
  ]);
  if (timeout) clearTimeout(timeout);
}

function isTimeout(error: unknown): boolean {
  if (error instanceof ChatTimeoutError) return true;
  if (typeof error !== "object" || error === null) return false;
  const name = "name" in error ? error.name : undefined;
  if (name === "TimeoutError" || name === "AbortError") return true;
  return "cause" in error ? isTimeout(error.cause) : false;
}

function chatFailure(error: unknown, timer: StageTimer): AskResult {
  if (error instanceof ChatConfigError) {
    timer.done("not-configured");
    return { status: 503, body: { error: error.message } };
  }
  if (demoLimitMessage(error)) {
    timer.done("limit");
    return { status: 429, body: { error: "Demo limit reached, try again later." } };
  }
  if (isTimeout(error)) {
    timer.done("timeout");
    return { status: 504, body: { error: "That took too long. Try again." } };
  }
  timer.done("error");
  console.error("Chat request failed");
  return { status: 500, body: { error: "Chat failed. Try again later." } };
}

type StageTimer = {
  mark: (stage: string, passages?: readonly { content: string }[]) => void;
  done: (outcome: string) => void;
};

/**
 * One log line per question with how long each step took. It records sizes and
 * timings only, never the question, the answer, or document text.
 */
function stageTimer(kind: string): StageTimer {
  const started = Date.now();
  let last = started;
  const stages: Record<string, number | string> = { kind };
  return {
    mark(stage, passages) {
      const now = Date.now();
      stages[`${stage}Ms`] = now - last;
      last = now;
      if (passages) {
        stages.passages = passages.length;
        stages.chars = passages.reduce((total, passage) => total + passage.content.length, 0);
      }
    },
    done(outcome) {
      stages.outcome = outcome;
      stages.totalMs = Date.now() - started;
      console.info(`chat timing ${JSON.stringify(stages)}`);
    },
  };
}

async function answerDemoMarkdown(
  input: {
    viewerUserId: string | null;
    question: string;
    ip: string;
    now: Date;
  },
  env: NodeJS.ProcessEnv,
): Promise<AskResult> {
  const question = input.question.trim();
  if (!input.viewerUserId) {
    const allowed = await takeDemoQuestionSlot(input.ip, input.now);
    if (!allowed) {
      return { status: 429, body: { error: "Demo limit reached, try again later." } };
    }
  }

  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return { status: 503, body: { error: "Chat is not configured" } };
  }

  const timer = stageTimer("demo-note");
  try {
    const passages = passagesForMarkdownFile(DEMO_MARKDOWN_FILE) ?? [];
    timer.mark("passages", passages);
    const result = await answerFromPassages(question, passages, (prompt) =>
      completePrompt(env, prompt),
    );
    timer.mark("model");
    if (input.viewerUserId) {
      await saveWithin(
        recordAskedQuestion({
          userId: input.viewerUserId,
          documentId: null,
          documentTitle: DEMO_MARKDOWN_TITLE,
          question,
          answer: result.answer,
        }),
      );
      timer.mark("save");
    }
    timer.done("ok");
    return { status: 200, body: result };
  } catch (error) {
    return chatFailure(error, timer);
  }
}

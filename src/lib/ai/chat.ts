import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  type ModelMessage,
} from "ai";
import { DEMO_LIMIT_MESSAGE, demoLimitMessage, demoLimitResponse } from "@/lib/ai/limits";

export const DEFAULT_CHAT_MODEL = "gemini-3.5-flash-lite";

export function chatModelFromEnv(env: NodeJS.ProcessEnv = process.env): string {
  const model = env.CHAT_MODEL?.trim();
  return model ? model : DEFAULT_CHAT_MODEL;
}

export function openRouterModelFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const model = env.OPENROUTER_MODEL?.trim();
  return model ? model : null;
}

export type ChatAttempt = {
  name: string;
  send: () => Promise<Response>;
};

export async function sendChatWithFallback(
  attempts: readonly ChatAttempt[],
): Promise<Response> {
  if (attempts.length === 0) {
    return Response.json({ error: "Chat is not configured" }, { status: 503 });
  }

  let sawLimit = false;
  for (const attempt of attempts) {
    try {
      return await attempt.send();
    } catch (error) {
      if (demoLimitMessage(error)) {
        sawLimit = true;
        continue;
      }
      throw error;
    }
  }

  if (sawLimit) {
    return demoLimitResponse();
  }

  return Response.json({ error: "Chat is not configured" }, { status: 503 });
}

export function uiMessageResponse(text: string): Response {
  const stream = createUIMessageStream({
    execute({ writer }) {
      writer.write({ type: "start" });
      writer.write({ type: "start-step" });
      writer.write({ type: "text-start", id: "text" });
      writer.write({ type: "text-delta", id: "text", delta: text });
      writer.write({ type: "text-end", id: "text" });
      writer.write({ type: "finish-step" });
      writer.write({ type: "finish" });
    },
  });

  return createUIMessageStreamResponse({ stream });
}

export class DemoLimitError extends Error {
  readonly statusCode = 429;

  constructor() {
    super(DEMO_LIMIT_MESSAGE);
    this.name = "DemoLimitError";
  }
}

export class ChatConfigError extends Error {
  readonly statusCode = 503;

  constructor() {
    super("Chat is not configured");
    this.name = "ChatConfigError";
  }
}

type TextAttempt = {
  name: string;
  send: () => Promise<string>;
};

export function createTextAttempts(
  env: NodeJS.ProcessEnv,
  prompt: string,
): TextAttempt[] {
  const messages: ModelMessage[] = [{ role: "user", content: prompt }];
  const attempts: TextAttempt[] = [];
  const geminiKey = env.GEMINI_API_KEY?.trim();

  if (geminiKey) {
    const modelId = chatModelFromEnv(env);
    attempts.push({
      name: "gemini",
      async send() {
        const google = createGoogleGenerativeAI({ apiKey: geminiKey });
        const result = await generateText({
          model: google(modelId),
          messages,
          maxRetries: 0,
        });
        return result.text;
      },
    });
  }

  const openRouterKey = env.OPENROUTER_API_KEY?.trim();
  const openRouterModel = openRouterModelFromEnv(env);
  if (openRouterKey && openRouterModel) {
    attempts.push({
      name: "openrouter",
      async send() {
        const openRouter = createOpenAI({
          baseURL: "https://openrouter.ai/api/v1",
          apiKey: openRouterKey,
          name: "openrouter",
        });
        const result = await generateText({
          model: openRouter.chat(openRouterModel),
          messages,
          maxRetries: 0,
        });
        return result.text;
      },
    });
  }

  return attempts;
}

export async function completePrompt(
  env: NodeJS.ProcessEnv,
  prompt: string,
): Promise<string> {
  const attempts = createTextAttempts(env, prompt);
  if (attempts.length === 0) {
    throw new ChatConfigError();
  }

  let sawLimit = false;
  for (const attempt of attempts) {
    try {
      return await attempt.send();
    } catch (error) {
      if (demoLimitMessage(error)) {
        sawLimit = true;
        continue;
      }
      throw error;
    }
  }

  if (sawLimit) {
    throw new DemoLimitError();
  }

  throw new ChatConfigError();
}

export function createChatAttempts(
  env: NodeJS.ProcessEnv,
  messages: ModelMessage[],
): ChatAttempt[] {
  const attempts: ChatAttempt[] = [];
  const geminiKey = env.GEMINI_API_KEY?.trim();

  if (geminiKey) {
    const modelId = chatModelFromEnv(env);
    attempts.push({
      name: "gemini",
      async send() {
        const google = createGoogleGenerativeAI({ apiKey: geminiKey });
        const result = await generateText({
          model: google(modelId),
          messages,
          maxRetries: 0,
        });
        return uiMessageResponse(result.text);
      },
    });
  }

  const openRouterKey = env.OPENROUTER_API_KEY?.trim();
  const openRouterModel = openRouterModelFromEnv(env);
  if (openRouterKey && openRouterModel) {
    attempts.push({
      name: "openrouter",
      async send() {
        const openRouter = createOpenAI({
          baseURL: "https://openrouter.ai/api/v1",
          apiKey: openRouterKey,
          name: "openrouter",
        });
        const result = await generateText({
          model: openRouter.chat(openRouterModel),
          messages,
          maxRetries: 0,
        });
        return uiMessageResponse(result.text);
      },
    });
  }

  return attempts;
}

import { createOpenAI } from "@ai-sdk/openai";

/**
 * OpenRouter provider via the OpenAI-compatible API.
 * Swap model IDs freely (Gemini, Llama, Claude, etc.) at call sites.
 */
export const openRouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  name: "openrouter",
});

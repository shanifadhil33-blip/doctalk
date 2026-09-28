import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import { openRouter } from "@/lib/ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    // OpenRouter chat-completions path (not OpenAI Responses API)
    model: openRouter.chat("google/gemini-pro"),
    messages: await convertToModelMessages(messages),
  });

  // AI SDK v7: toDataStreamResponse() was replaced by toUIMessageStreamResponse()
  return result.toUIMessageStreamResponse();
}

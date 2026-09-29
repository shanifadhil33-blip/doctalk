import { convertToModelMessages, type UIMessage } from "ai";
import { auth } from "@/auth";
import { createChatAttempts, sendChatWithFallback } from "@/lib/ai/chat";
import { userIdFromTokenSub } from "@/lib/auth/user-id";

export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth();
  if (!userIdFromTokenSub(session?.user?.id)) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!isChatRequest(body)) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const messages = await convertToModelMessages(body.messages);
    return await sendChatWithFallback(createChatAttempts(process.env, messages));
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
    console.error("Chat request failed");
    return Response.json(
      { error: "Chat failed. Try again later." },
      { status: 500 },
    );
  }
}

function isChatRequest(body: unknown): body is { messages: UIMessage[] } {
  return (
    typeof body === "object" &&
    body !== null &&
    "messages" in body &&
    Array.isArray(body.messages)
  );
}

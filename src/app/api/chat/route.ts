import { auth } from "@/auth";
import { userIdFromTokenSub } from "@/lib/auth/user-id";
import { clientIp } from "@/lib/demo/quota";
import { askDocument } from "@/lib/retrieval/ask";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  const viewerUserId = userIdFromTokenSub(session?.user?.id);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!isQuestion(body)) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await askDocument({
    viewerUserId,
    documentId: body.documentId,
    question: body.question,
    ip: clientIp(req.headers),
    now: new Date(),
  });
  return Response.json(result.body, { status: result.status });
}

function isQuestion(body: unknown): body is { documentId: string; question: string } {
  return (
    typeof body === "object" &&
    body !== null &&
    "documentId" in body &&
    typeof body.documentId === "string" &&
    "question" in body &&
    typeof body.question === "string"
  );
}

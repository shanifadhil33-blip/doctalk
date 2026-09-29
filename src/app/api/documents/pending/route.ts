import { auth } from "@/auth";
import { userIdFromTokenSub } from "@/lib/auth/user-id";
import { cancelPendingUpload } from "@/lib/documents/store-upload";

export const runtime = "nodejs";

export async function DELETE(req: Request) {
  const session = await auth();
  const userId = userIdFromTokenSub(session?.user?.id);
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("uploadId" in body) ||
    typeof body.uploadId !== "string"
  ) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await cancelPendingUpload(userId, body.uploadId);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }
    return Response.json({ ok: true });
  } catch {
    console.error("Pending upload release failed");
    return Response.json({ error: "Upload failed. Try again later." }, { status: 500 });
  }
}

import { auth } from "@/auth";
import { userIdFromTokenSub } from "@/lib/auth/user-id";
import { removeOwnedDocument } from "@/lib/documents/store-upload";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  const userId = userIdFromTokenSub(session?.user?.id);
  if (!userId) {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  try {
    const result = await removeOwnedDocument(userId, id);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: result.status });
    }
    return Response.json({ ok: true });
  } catch {
    console.error("Delete failed");
    return Response.json({ error: "Could not delete that document." }, { status: 500 });
  }
}

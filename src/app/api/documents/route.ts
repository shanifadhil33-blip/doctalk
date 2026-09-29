import { auth } from "@/auth";
import { userIdFromTokenSub } from "@/lib/auth/user-id";
import { loadVisibleDocuments } from "@/lib/documents/list";
import { finishUploadedPdf, removeOwnedDocument } from "@/lib/documents/store-upload";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  const session = await auth();
  const viewerUserId = userIdFromTokenSub(session?.user?.id);
  try {
    const result = await loadVisibleDocuments(viewerUserId);
    return Response.json({ documents: result.documents });
  } catch {
    console.error("Document list failed");
    return Response.json({ error: "Could not load documents." }, { status: 500 });
  }
}

export async function POST(req: Request) {
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
  if (!isCompletedUpload(body)) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const saved = await finishUploadedPdf({
      userId,
      uploadId: body.uploadId,
      url: body.url,
      pathname: body.pathname,
    });
    if (!saved.ok) {
      return Response.json(
        {
          error: saved.error,
          ...(saved.documentId ? { document: { id: saved.documentId } } : {}),
        },
        { status: saved.status },
      );
    }
    return Response.json({ document: saved.document }, { status: 201 });
  } catch {
    console.error("Upload failed");
    return Response.json({ error: "Upload failed. Try again later." }, { status: 500 });
  }
}

function isCompletedUpload(
  body: unknown,
): body is { uploadId: string; url: string; pathname: string } {
  return (
    typeof body === "object" &&
    body !== null &&
    "uploadId" in body &&
    typeof body.uploadId === "string" &&
    "url" in body &&
    typeof body.url === "string" &&
    "pathname" in body &&
    typeof body.pathname === "string"
  );
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get("id");
  let fromBody: string | null = null;
  if (!fromQuery) {
    try {
      const body: unknown = await req.json();
      if (
        typeof body === "object" &&
        body !== null &&
        "id" in body &&
        typeof body.id === "string"
      ) {
        fromBody = body.id;
      }
    } catch {
      fromBody = null;
    }
  }
  const id = fromQuery ?? fromBody;
  if (!id) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  return deleteOwned(id);
}

async function deleteOwned(id: string): Promise<Response> {
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

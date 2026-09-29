import { auth } from "@/auth";
import { userIdFromTokenSub } from "@/lib/auth/user-id";
import { loadVisibleDocuments } from "@/lib/documents/list";
import {
  countOwnedDocuments,
  removeOwnedDocument,
  saveUploadedPdf,
} from "@/lib/documents/store-upload";
import {
  PDF_LIMIT_MESSAGE,
  validatePdfUpload,
  withinDocumentLimit,
} from "@/lib/documents/upload-policy";

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

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Choose a PDF." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const checked = validatePdfUpload({
    name: file.name,
    size: file.size,
    type: file.type,
    bytes,
  });
  if (!checked.ok) {
    return Response.json({ error: checked.message }, { status: 400 });
  }

  try {
    const existing = await countOwnedDocuments(userId);
    if (!withinDocumentLimit(existing)) {
      return Response.json({ error: PDF_LIMIT_MESSAGE }, { status: 400 });
    }

    const saved = await saveUploadedPdf({
      userId,
      fileName: checked.fileName,
      bytes,
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

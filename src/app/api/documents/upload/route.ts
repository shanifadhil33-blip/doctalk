import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/auth";
import { userIdFromTokenSub } from "@/lib/auth/user-id";
import { reserveOwnedUpload } from "@/lib/documents/reserve-slot";
import { authorizeUploadToken, UploadTokenError } from "@/lib/documents/upload-token";
import { MAX_PDF_BYTES } from "@/lib/upload-validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return Response.json({ error: "File storage is not configured." }, { status: 503 });
  }
  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "Database is not configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!isHandleUploadBody(body)) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const session = await auth();
        const userId = userIdFromTokenSub(session?.user?.id);
        const decision = await authorizeUploadToken({
          userId,
          pathname,
          clientPayload,
          reserve: reserveOwnedUpload,
        });
        if (!decision.ok) {
          throw new UploadTokenError(decision.message, decision.status);
        }
        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: MAX_PDF_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            userId,
            uploadId: decision.uploadId,
            documentId: decision.documentId,
          }),
        };
      },
    });
    return Response.json(jsonResponse);
  } catch (error) {
    if (error instanceof UploadTokenError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error("Upload token failed");
    return Response.json({ error: "Upload failed. Try again later." }, { status: 500 });
  }
}

function isHandleUploadBody(body: unknown): body is HandleUploadBody {
  if (typeof body !== "object" || body === null || !("type" in body)) return false;
  const type = body.type;
  if (type !== "blob.generate-client-token" && type !== "blob.upload-completed") {
    return false;
  }
  if (type === "blob.upload-completed") return true;
  if (!("payload" in body) || typeof body.payload !== "object" || body.payload === null) {
    return false;
  }
  const payload = body.payload as Record<string, unknown>;
  return typeof payload.pathname === "string";
}

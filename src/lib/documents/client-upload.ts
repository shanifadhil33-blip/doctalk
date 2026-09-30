import { upload } from "@vercel/blob/client";
import { isMarkdownFileName, markdownExtension } from "@/lib/markdown/sections";

const HANDLE_UPLOAD_URL = "/api/documents/upload";

export async function uploadDocumentFromBrowser(file: File): Promise<{ id: string }> {
  const uploadId = crypto.randomUUID();
  const markdown = isMarkdownFileName(file.name);
  const extension = markdown ? (markdownExtension(file.name) ?? "md") : "pdf";
  const pathname = `uploads/${uploadId}.${extension}`;
  const contentType = markdown ? "text/markdown" : "application/pdf";
  const clientPayload = JSON.stringify({
    uploadId,
    fileName: file.name,
    size: file.size,
    type: file.type || contentType,
  });

  const tokenResponse = await fetch(HANDLE_UPLOAD_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "blob.generate-client-token",
      payload: { pathname, clientPayload, multipart: false },
    }),
  });
  const tokenBody: unknown = await tokenResponse.json().catch(() => null);
  if (!tokenResponse.ok || !hasClientToken(tokenBody)) {
    await releasePending(uploadId);
    throw new Error(readError(tokenBody) ?? "Upload failed. Try again later.");
  }

  let blob: { url: string; pathname: string };
  try {
    blob = await upload(pathname, file, {
      access: "private",
      handleUploadUrl: HANDLE_UPLOAD_URL,
      contentType,
      clientPayload,
    });
  } catch (error) {
    await releasePending(uploadId);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("client token")) {
      throw new Error("Upload failed. Try again later.");
    }
    throw error instanceof Error ? error : new Error("Upload failed. Try again later.");
  }

  const response = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uploadId,
      url: blob.url,
      pathname: blob.pathname,
    }),
  });
  const payload: unknown = await response.json().catch(() => null);
  const id = readUploadedId(payload);
  if (!response.ok) {
    throw new Error(readError(payload) ?? "Upload failed. Try again later.");
  }
  if (!id) {
    throw new Error("Upload failed. Try again later.");
  }
  return { id };
}

/** @deprecated Use uploadDocumentFromBrowser. Kept so older imports still compile. */
export const uploadPdfFromBrowser = uploadDocumentFromBrowser;

async function releasePending(uploadId: string): Promise<void> {
  await fetch("/api/documents/pending", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uploadId }),
  }).catch(() => undefined);
}

function hasClientToken(payload: unknown): boolean {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "clientToken" in payload &&
    typeof payload.clientToken === "string" &&
    payload.clientToken.length > 0
  );
}

function readError(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("error" in payload)) return null;
  return typeof payload.error === "string" ? payload.error : null;
}

function readUploadedId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("document" in payload)) return null;
  const document = payload.document;
  if (!document || typeof document !== "object" || !("id" in document)) return null;
  return typeof document.id === "string" ? document.id : null;
}

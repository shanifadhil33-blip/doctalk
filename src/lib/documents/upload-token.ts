import {
  clientUploadPath,
  isUploadId,
  type UploadExtension,
} from "@/lib/documents/blob-url";
import { uploadExtensionFor, safeUploadFileName } from "@/lib/documents/upload-policy";
import { isMarkdownFileName } from "@/lib/markdown/sections";
import {
  FILE_TOO_LARGE_MESSAGE,
  MAX_PDF_BYTES,
  UNSUPPORTED_UPLOAD_MESSAGE,
} from "@/lib/upload-validation";

export class UploadTokenError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "UploadTokenError";
    this.status = status;
  }
}

type ReserveUpload = (input: {
  userId: string;
  uploadId: string;
  fileName: string;
}) => Promise<{ ok: true; documentId: string } | { ok: false; message: string }>;

export type UploadTokenDecision =
  | {
      ok: true;
      uploadId: string;
      documentId: string;
      fileName: string;
      extension: UploadExtension;
    }
  | { ok: false; status: number; message: string };

export async function authorizeUploadToken(input: {
  userId: string | null;
  pathname: string;
  clientPayload: string | null;
  reserve: ReserveUpload;
}): Promise<UploadTokenDecision> {
  if (!input.userId) {
    return { ok: false, status: 401, message: "Sign in required" };
  }

  const payload = parseUploadClientPayload(input.clientPayload);
  if (!payload.ok) {
    return { ok: false, status: 400, message: payload.message };
  }

  if (input.pathname !== clientUploadPath(payload.uploadId, payload.extension)) {
    return { ok: false, status: 400, message: "Invalid request" };
  }

  if (!contentTypeAllowed(payload.extension, payload.type)) {
    return { ok: false, status: 400, message: UNSUPPORTED_UPLOAD_MESSAGE };
  }

  if (!Number.isFinite(payload.size) || payload.size <= 0) {
    return { ok: false, status: 400, message: "That file is empty." };
  }

  if (payload.size > MAX_PDF_BYTES) {
    return {
      ok: false,
      status: 400,
      message: payload.extension === "pdf" ? "PDF must be 10 MB or smaller." : FILE_TOO_LARGE_MESSAGE,
    };
  }

  const reserved = await input.reserve({
    userId: input.userId,
    uploadId: payload.uploadId,
    fileName: payload.fileName,
  });
  if (!reserved.ok) {
    return { ok: false, status: 400, message: reserved.message };
  }

  return {
    ok: true,
    uploadId: payload.uploadId,
    documentId: reserved.documentId,
    fileName: payload.fileName,
    extension: payload.extension,
  };
}

function contentTypeAllowed(extension: UploadExtension, type: string): boolean {
  if (extension === "pdf") {
    return type === "" || type === "application/pdf";
  }
  return (
    type === "" ||
    type === "text/markdown" ||
    type === "text/x-markdown" ||
    type === "text/plain" ||
    type === "application/octet-stream"
  );
}

function parseUploadClientPayload(
  raw: string | null,
):
  | {
      ok: true;
      uploadId: string;
      fileName: string;
      size: number;
      type: string;
      extension: UploadExtension;
    }
  | { ok: false; message: string } {
  if (!raw) return { ok: false, message: "Invalid request" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, message: "Invalid request" };
  }
  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, message: "Invalid request" };
  }
  const record = parsed as Record<string, unknown>;
  if (typeof record.uploadId !== "string" || !isUploadId(record.uploadId)) {
    return { ok: false, message: "Invalid request" };
  }
  if (typeof record.fileName !== "string" || record.fileName.trim().length === 0) {
    return { ok: false, message: "Choose a PDF or Markdown file." };
  }
  if (typeof record.size !== "number") {
    return { ok: false, message: "Invalid request" };
  }
  const fileName = safeUploadFileName(record.fileName);
  if (!fileName.toLowerCase().endsWith(".pdf") && !isMarkdownFileName(fileName)) {
    return { ok: false, message: UNSUPPORTED_UPLOAD_MESSAGE };
  }
  const type = typeof record.type === "string" ? record.type.trim().toLowerCase() : "";
  return {
    ok: true,
    uploadId: record.uploadId,
    fileName,
    size: record.size,
    type,
    extension: uploadExtensionFor(fileName),
  };
}

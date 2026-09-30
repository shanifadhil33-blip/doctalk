import { isMarkdownFileName } from "@/lib/markdown/sections";

export const MAX_PDF_BYTES = 10 * 1024 * 1024;

export const UNSUPPORTED_UPLOAD_MESSAGE =
  "Only PDF and Markdown files can be uploaded.";

export const FILE_TOO_LARGE_MESSAGE = "File must be 10 MB or smaller.";

export type PdfValidationResult =
  | { ok: true }
  | { ok: false; message: string };

const MARKDOWN_TYPES = new Set([
  "",
  "text/markdown",
  "text/x-markdown",
  "text/plain",
  "application/octet-stream",
]);

export function validatePdfFile(file: {
  name: string;
  size: number;
  type: string;
}): PdfValidationResult {
  const name = file.name.trim().toLowerCase();
  const type = file.type.trim().toLowerCase();
  const extensionOk = name.endsWith(".pdf");
  const typeOk = type === "" || type === "application/pdf";

  if (!extensionOk || !typeOk) {
    return { ok: false, message: "Only PDF files can be uploaded." };
  }

  if (!Number.isFinite(file.size) || file.size <= 0) {
    return { ok: false, message: "That file is empty." };
  }

  if (file.size > MAX_PDF_BYTES) {
    return { ok: false, message: "PDF must be 10 MB or smaller." };
  }

  return { ok: true };
}

/** Signed-in uploads: a PDF, or a Markdown file (.md / .markdown). */
export function validateDocumentFile(file: {
  name: string;
  size: number;
  type: string;
}): PdfValidationResult {
  if (isMarkdownFileName(file.name)) {
    const type = file.type.trim().toLowerCase();
    if (!MARKDOWN_TYPES.has(type)) {
      return { ok: false, message: UNSUPPORTED_UPLOAD_MESSAGE };
    }
    if (!Number.isFinite(file.size) || file.size <= 0) {
      return { ok: false, message: "That file is empty." };
    }
    if (file.size > MAX_PDF_BYTES) {
      return { ok: false, message: FILE_TOO_LARGE_MESSAGE };
    }
    return { ok: true };
  }

  const pdf = validatePdfFile(file);
  if (!pdf.ok && pdf.message === "Only PDF files can be uploaded.") {
    return { ok: false, message: UNSUPPORTED_UPLOAD_MESSAGE };
  }
  return pdf;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

import { classifyStoredFileUrl } from "@/lib/documents/blob-url";
import { MAX_PDF_BYTES, validatePdfFile } from "@/lib/upload-validation";

export const MAX_DOCUMENTS_PER_USER = 5;

export const PDF_LIMIT_MESSAGE =
  "You can keep up to 5 documents. Delete one to upload another.";

export function withinDocumentLimit(existingCount: number): boolean {
  return existingCount < MAX_DOCUMENTS_PER_USER;
}

export function hasPdfMagic(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  );
}

export function validatePdfUpload(file: {
  name: string;
  size: number;
  type: string;
  bytes: Uint8Array;
}): { ok: true; fileName: string } | { ok: false; message: string } {
  const basic = validatePdfFile({
    name: file.name,
    size: file.size,
    type: file.type,
  });
  if (!basic.ok) return basic;
  if (file.bytes.byteLength > MAX_PDF_BYTES) {
    return { ok: false, message: "PDF must be 10 MB or smaller." };
  }
  if (!hasPdfMagic(file.bytes)) {
    return { ok: false, message: "That file is not a PDF." };
  }
  return { ok: true, fileName: safePdfFileName(file.name) };
}

export function safePdfFileName(name: string): string {
  const base = name.split(/[/\\]/).pop()?.trim() || "document.pdf";
  const cleaned = base.replace(/[^\w.\- ()]+/g, "_").slice(0, 180);
  return cleaned.toLowerCase().endsWith(".pdf") ? cleaned : `${cleaned}.pdf`;
}

export function pdfSrcFor(
  documentId: string,
  fileUrl: string | undefined,
): string | undefined {
  if (!fileUrl) return undefined;
  const kind = classifyStoredFileUrl(fileUrl);
  if (kind === "local") return fileUrl;
  if (kind === "private-blob" || kind === "public-blob") {
    return `/api/documents/${documentId}/file`;
  }
  return undefined;
}

export const MAX_PDF_BYTES = 10 * 1024 * 1024;

export type PdfValidationResult =
  | { ok: true }
  | { ok: false; message: string };

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

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

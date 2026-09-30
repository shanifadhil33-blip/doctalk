import { demoPdfs, plainDemoLine } from "@/lib/demo/pdf-catalog";
import { getDemoDocument } from "@/lib/demo-documents";
import { blockText } from "@/lib/document-types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PREVIEW_LINE_LIMIT = 6;

function isSampleStatus(status: string | undefined): boolean {
  return status === undefined || status === "Sample";
}

/**
 * Public demo files are served from /demo. A user's own upload keeps the
 * file route even if its name matches a sample.
 */
export function documentPreviewSrc(
  id: string,
  fileName: string,
  status?: string,
): string | null {
  const seeded = demoPdfs.find((pdf) => pdf.fileName === fileName);
  if (seeded && isSampleStatus(status)) return seeded.fileUrl;
  if (UUID_PATTERN.test(id)) return `/api/documents/${id}/file`;
  return null;
}

export function knownPageCount(
  id: string,
  fileName: string,
  status?: string,
): number | null {
  const seeded = demoPdfs.find((pdf) => pdf.fileName === fileName);
  if (seeded && isSampleStatus(status)) return seeded.pages.length;
  return getDemoDocument(id)?.pageCount ?? null;
}

/** First-page lines taken from the file's own text. Empty when we have none. */
export function documentPreviewLines(
  id: string,
  fileName: string,
  status?: string,
): string[] {
  const seeded = demoPdfs.find((pdf) => pdf.fileName === fileName);
  const seededPage = seeded?.pages[0];
  if (seeded && isSampleStatus(status) && seededPage && seededPage.length > 0) {
    return seededPage.map(plainDemoLine).filter((line) => line.length > 0).slice(0, PREVIEW_LINE_LIMIT);
  }

  const page = getDemoDocument(id)?.pages[0];
  if (!page) return [];

  const lines: string[] = [];
  if (page.kicker.trim()) lines.push(page.kicker.trim());
  for (const block of page.blocks) {
    if (lines.length >= PREVIEW_LINE_LIMIT) break;
    if (
      (block.kind === "heading" || block.kind === "subheading") &&
      block.text.trim() === page.kicker.trim()
    ) {
      continue;
    }
    if (block.kind === "table") {
      lines.push(block.columns.join(" · "));
      for (const row of block.rows) {
        if (lines.length >= PREVIEW_LINE_LIMIT) break;
        lines.push(row.join(" · "));
      }
      continue;
    }
    const text = blockText(block).replace(/\s+/g, " ").trim();
    if (!text) continue;
    lines.push(text);
  }
  return lines.slice(0, PREVIEW_LINE_LIMIT);
}

export function metaWithPageCount(meta: string, pageCount: number): string {
  if (pageCount <= 0 || /\bpage/i.test(meta)) return meta;
  const label = pageCount === 1 ? "1 page" : `${pageCount} pages`;
  return `${label} · ${meta}`;
}

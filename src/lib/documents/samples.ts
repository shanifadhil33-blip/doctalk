import { demoDocuments } from "@/lib/demo-documents";
import { DEMO_MARKDOWN_FILE, DEMO_MARKDOWN_ID } from "@/lib/demo/markdown-catalog";
import { demoPdfs } from "@/lib/demo/pdf-catalog";

const sampleIds = new Set<string>([
  ...demoDocuments.map((item) => item.id),
  DEMO_MARKDOWN_ID,
]);

const sampleNames = new Set<string>([
  ...demoPdfs.map((item) => item.fileName),
  ...demoDocuments.map((item) => item.fileName),
  DEMO_MARKDOWN_FILE,
]);

export const sampleFileNames: [string, ...string[]] = [
  DEMO_MARKDOWN_FILE,
  ...demoPdfs.map((item) => item.fileName),
  ...demoDocuments.map((item) => item.fileName),
];

/** Seeded demo files, including copies that kept the sample flag, id, or file name. */
export function isPublicSample(row: {
  id?: string;
  fileName?: string;
  isDemo?: boolean;
  status?: string;
}): boolean {
  if (row.isDemo === true || row.status === "Sample") return true;
  if (row.id !== undefined && sampleIds.has(row.id)) return true;
  if (row.fileName !== undefined && sampleNames.has(row.fileName)) return true;
  return false;
}

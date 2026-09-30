import { readFileSync } from "node:fs";
import path from "node:path";
import {
  DEMO_MARKDOWN_DISK,
  DEMO_MARKDOWN_FILE,
  isDemoMarkdownFile,
} from "@/lib/demo/markdown-catalog";
import { parseMarkdownSections } from "@/lib/markdown/sections";
import { chunkPages } from "@/lib/pdf/chunk";
import type { Passage } from "@/lib/retrieval/answer";

let cachedSource: string | null = null;

export function demoMarkdownSource(): string {
  if (cachedSource !== null) return cachedSource;
  cachedSource = readFileSync(
    path.join(process.cwd(), "public", "demo", DEMO_MARKDOWN_DISK),
    "utf8",
  );
  return cachedSource;
}

/** Passages for the public markdown sample, labeled by heading rather than page. */
export function passagesForMarkdownFile(fileName: string): Passage[] | null {
  if (!isDemoMarkdownFile(fileName)) return null;
  const sections = parseMarkdownSections(demoMarkdownSource());
  const headingForSection = new Map(sections.map((section) => [section.index, section.heading]));
  return chunkPages(sections.map((section) => ({ page: section.index, text: section.text }))).map(
    (chunk) => {
      const label = headingForSection.get(chunk.page);
      return {
        page: chunk.page,
        content: chunk.content,
        ...(label ? { label } : {}),
      };
    },
  );
}

export { DEMO_MARKDOWN_FILE };

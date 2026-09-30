export type MarkdownSection = {
  /** 1-based section order. This is not a PDF page. */
  index: number;
  heading: string;
  text: string;
};

const ATX_HEADING = /^(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/;

export function isMarkdownFileName(name: string): boolean {
  const base = name.trim().toLowerCase().split(/[/\\]/).pop() ?? "";
  return base.endsWith(".markdown") || base.endsWith(".md");
}

export function markdownExtension(name: string): "md" | "markdown" | null {
  const base = name.trim().toLowerCase().split(/[/\\]/).pop() ?? "";
  if (base.endsWith(".markdown")) return "markdown";
  if (base.endsWith(".md")) return "md";
  return null;
}

/**
 * Split a markdown note on ATX headings. Text before the first heading is
 * "Introduction". The returned text includes the heading line so a citation
 * quote still shows the section it came from.
 */
export function parseMarkdownSections(source: string): MarkdownSection[] {
  const normalized = source
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  const blocks: { heading: string; lines: string[] }[] = [];
  let current: { heading: string; lines: string[] } | null = null;

  for (const line of lines) {
    const match = ATX_HEADING.exec(line);
    if (match) {
      const heading = cleanHeading(match[2] ?? "");
      if (heading) {
        if (current) blocks.push(current);
        current = { heading, lines: [heading] };
        continue;
      }
    }
    if (!current) current = { heading: "Introduction", lines: [] };
    current.lines.push(line);
  }
  if (current) blocks.push(current);

  const sections: MarkdownSection[] = [];
  for (const block of blocks) {
    const text = block.lines.join("\n").replace(/[ \t]+\n/g, "\n").trim();
    if (!text) continue;
    sections.push({
      index: sections.length + 1,
      heading: block.heading,
      text,
    });
  }
  return sections;
}

function cleanHeading(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

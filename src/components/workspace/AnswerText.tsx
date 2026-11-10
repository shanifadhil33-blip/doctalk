import type { ReactNode } from "react";

/**
 * Renders the small Markdown subset a model answer uses: paragraphs, bullet and
 * numbered lists, headings, bold, italics, and inline code. It builds React
 * elements from text, so nothing in the answer is treated as HTML.
 */
export function AnswerText({ text }: { text: string }) {
  return <div className="mt-1 select-text space-y-2 break-words">{renderBlocks(text)}</div>;
}

type Block =
  | { kind: "paragraph"; lines: string[] }
  | { kind: "heading"; text: string }
  | { kind: "list"; ordered: boolean; start: number; items: string[] };

const BULLET = /^\s*[-*+•]\s+(.*)$/;
const NUMBERED = /^\s*(\d{1,3})[.)]\s+(.*)$/;
const HEADING = /^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/;

export function parseAnswerBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: Extract<Block, { kind: "list" }> | null = null;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ kind: "paragraph", lines: paragraph });
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = HEADING.exec(line);
    const bullet = BULLET.exec(line);
    const numbered = NUMBERED.exec(line);
    if (heading?.[1]) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "heading", text: heading[1] });
    } else if (bullet?.[1] !== undefined) {
      flushParagraph();
      if (!list || list.ordered) {
        flushList();
        list = { kind: "list", ordered: false, start: 1, items: [] };
      }
      list.items.push(bullet[1]);
    } else if (numbered?.[2] !== undefined) {
      flushParagraph();
      if (!list || !list.ordered) {
        flushList();
        list = { kind: "list", ordered: true, start: Number(numbered[1]) || 1, items: [] };
      }
      list.items.push(numbered[2]);
    } else if (list && /^\s{2,}\S/.test(raw)) {
      // An indented line continues the previous list item.
      list.items[list.items.length - 1] += ` ${line.trim()}`;
    } else {
      flushList();
      paragraph.push(line.trim());
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

function renderBlocks(text: string): ReactNode[] {
  return parseAnswerBlocks(text).map((block, index) => {
    if (block.kind === "heading") {
      return (
        <p key={index} className="font-semibold text-slate-950">
          {renderInline(block.text)}
        </p>
      );
    }
    if (block.kind === "list") {
      const items = block.items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>);
      return block.ordered ? (
        <ol key={index} start={block.start} className="list-decimal space-y-1 pl-5">
          {items}
        </ol>
      ) : (
        <ul key={index} className="list-disc space-y-1 pl-5">
          {items}
        </ul>
      );
    }
    return (
      <p key={index}>
        {block.lines.map((line, lineIndex) => (
          <span key={lineIndex}>
            {lineIndex > 0 ? <br /> : null}
            {renderInline(line)}
          </span>
        ))}
      </p>
    );
  });
}

const INLINE = /(`[^`\n]+`|\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\s][^*\n]*\*|_[^_\s][^_\n]*_)/g;

export function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(INLINE)) {
    const token = match[0];
    const at = match.index ?? 0;
    // Skip underscores inside words, like file_name.
    if (token.startsWith("_") && at > 0 && /\w/.test(text[at - 1] ?? "")) continue;
    if (at > last) out.push(text.slice(last, at));
    if (token.startsWith("`")) {
      out.push(
        <code key={key++} className="rounded bg-slate-100 px-1 font-mono text-[0.9em]">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**") || token.startsWith("__")) {
      out.push(
        <strong key={key++} className="font-semibold text-slate-950">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      out.push(<em key={key++}>{token.slice(1, -1)}</em>);
    }
    last = at + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Plain text for copying: the same words without Markdown marks. */
export function answerPlainText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/\*\*([^*\n]+)\*\*|__([^_\n]+)__/g, "$1$2")
    .replace(/`([^`\n]+)`/g, "$1")
    .trim();
}

/** Small PDF writer for the sample files. Not a general PDF library. */

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const BODY_SIZE = 12;
const BODY_LEADING = 16;
const TITLE_SIZE = 18;
const HEADING_SIZE = 13;
const META_SIZE = 10;
const FOOTER_SIZE = 9;
const TOP_BASELINE = 730;
const BOTTOM_LIMIT = 68;

/** Helvetica widths in thousandths of an em. Unknown characters use a wide estimate. */
const HELVETICA_UNITS: Record<string, number> = {
  " ": 278,
  ".": 278,
  ",": 278,
  ":": 278,
  ";": 278,
  "!": 333,
  "?": 556,
  "'": 191,
  '"': 355,
  "-": 333,
  "(": 333,
  ")": 333,
  "/": 278,
  $: 556,
  "%": 889,
  "&": 667,
  "@": 1015,
  "#": 556,
  "+": 584,
  "=": 584,
  "*": 389,
  "0": 556,
  "1": 556,
  "2": 556,
  "3": 556,
  "4": 556,
  "5": 556,
  "6": 556,
  "7": 556,
  "8": 556,
  "9": 556,
  a: 556,
  b: 556,
  c: 500,
  d: 556,
  e: 556,
  f: 278,
  g: 556,
  h: 556,
  i: 222,
  j: 222,
  k: 500,
  l: 222,
  m: 833,
  n: 556,
  o: 556,
  p: 556,
  q: 556,
  r: 333,
  s: 500,
  t: 278,
  u: 556,
  v: 500,
  w: 722,
  x: 500,
  y: 500,
  z: 500,
  A: 667,
  B: 667,
  C: 722,
  D: 722,
  E: 667,
  F: 611,
  G: 778,
  H: 722,
  I: 278,
  J: 500,
  K: 667,
  L: 556,
  M: 833,
  N: 722,
  O: 778,
  P: 667,
  Q: 778,
  R: 722,
  S: 667,
  T: 611,
  U: 722,
  V: 667,
  W: 944,
  X: 667,
  Y: 667,
  Z: 611,
};

export type PdfTextRole = "title" | "heading" | "meta" | "body";

export function plainPdfLine(line: string): { role: PdfTextRole; text: string } {
  const trimmed = line.trim();
  if (trimmed.startsWith("# ")) {
    return { role: "heading", text: trimmed.slice(2).trim() };
  }
  if (trimmed.startsWith("> ")) {
    return { role: "meta", text: trimmed.slice(2).trim() };
  }
  return { role: "body", text: trimmed };
}

export function wrapPdfLine(
  text: string,
  fontSize: number,
  maxWidth = CONTENT_WIDTH,
  bold = false,
): string[] {
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (textWidth(next, fontSize, bold) <= maxWidth) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    if (textWidth(word, fontSize, bold) <= maxWidth) {
      current = word;
      continue;
    }
    let piece = "";
    for (const char of word) {
      const trial = piece + char;
      if (piece && textWidth(trial, fontSize, bold) > maxWidth) {
        lines.push(piece);
        piece = char;
      } else {
        piece = trial;
      }
    }
    current = piece;
  }
  if (current) lines.push(current);
  return lines;
}

export function buildPdf(pages: readonly (readonly string[])[]): Uint8Array {
  if (pages.length === 0) {
    throw new Error("A PDF needs at least one page");
  }

  const objects = new Map<number, string>();
  const pageIds: number[] = [];
  const contentIds: number[] = [];
  let nextId = 5;
  for (let index = 0; index < pages.length; index += 1) {
    pageIds.push(nextId);
    contentIds.push(nextId + 1);
    nextId += 2;
  }

  objects.set(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.set(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  pages.forEach((lines, index) => {
    const pageId = pageIds[index];
    const contentId = contentIds[index];
    if (!pageId || !contentId) {
      throw new Error("Missing PDF page id");
    }
    const stream = pageStream(lines, index + 1, pages.length);
    const length = new TextEncoder().encode(stream).length;
    objects.set(
      contentId,
      `<< /Length ${length} >>\nstream\n${stream}\nendstream`,
    );
    objects.set(
      pageId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Contents ${contentId} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>`,
    );
  });

  const kids = pageIds.map((id) => `${id} 0 R`).join(" ");
  objects.set(2, `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  objects.set(1, "<< /Type /Catalog /Pages 2 0 R >>");

  const maxId = nextId - 1;
  let body = "%PDF-1.4\n";
  const offsets = new Array<number>(maxId + 1).fill(0);
  const encoder = new TextEncoder();
  for (let id = 1; id <= maxId; id += 1) {
    const objectBody = objects.get(id);
    if (!objectBody) {
      throw new Error(`Missing PDF object ${id}`);
    }
    offsets[id] = encoder.encode(body).length;
    body += `${id} 0 obj\n${objectBody}\nendobj\n`;
  }

  const xrefStart = encoder.encode(body).length;
  let xref = `xref\n0 ${maxId + 1}\n`;
  xref += "0000000000 65535 f \n";
  for (let id = 1; id <= maxId; id += 1) {
    const offset = offsets[id] ?? 0;
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return encoder.encode(body + xref);
}

function pageStream(
  lines: readonly string[],
  pageNumber: number,
  pageCount: number,
): string {
  const commands: string[] = [];
  let cursor = TOP_BASELINE;
  const [first, ...rest] = lines;
  const title = first ? plainPdfLine(first).text : "";

  if (title) {
    cursor = drawParagraph(commands, title, "title", cursor, pageNumber);
    cursor -= 8;
    commands.push("0.75 0.75 0.75 RG");
    commands.push("0.8 w");
    commands.push(`${MARGIN_X} ${cursor.toFixed(2)} m ${PAGE_WIDTH - MARGIN_X} ${cursor.toFixed(2)} l S`);
    commands.push("0 0 0 RG");
    cursor -= 18;
  }

  for (const line of rest) {
    const parsed = plainPdfLine(line);
    if (!parsed.text) {
      cursor -= 8;
      continue;
    }
    if (parsed.role === "heading") cursor -= 8;
    cursor = drawParagraph(commands, parsed.text, parsed.role, cursor, pageNumber);
    cursor -= parsed.role === "meta" ? 2 : 6;
  }

  if (cursor < BOTTOM_LIMIT) {
    throw new Error(`Sample page ${pageNumber} does not fit on the page`);
  }

  const footer = `Sample document - Page ${pageNumber} of ${pageCount}`;
  commands.push("BT");
  commands.push(`0.35 0.35 0.35 rg`);
  commands.push(`/F1 ${FOOTER_SIZE} Tf`);
  commands.push(`1 0 0 1 ${MARGIN_X} 36 Tm`);
  commands.push(`(${escapePdfText(footer)}) Tj`);
  commands.push("ET");
  return commands.join("\n");
}

function drawParagraph(
  commands: string[],
  text: string,
  role: PdfTextRole,
  cursor: number,
  pageNumber: number,
): number {
  const bold = role === "title" || role === "heading";
  const size = role === "title" ? TITLE_SIZE : role === "heading" ? HEADING_SIZE : role === "meta" ? META_SIZE : BODY_SIZE;
  const leading = role === "title" ? 22 : role === "heading" ? 17 : role === "meta" ? 13 : BODY_LEADING;
  const font = bold ? "F2" : "F1";
  const wrapped = wrapPdfLine(text, size, CONTENT_WIDTH, bold);
  let y = cursor;
  for (const line of wrapped) {
    if (y < BOTTOM_LIMIT) {
      throw new Error(`Sample page ${pageNumber} does not fit on the page`);
    }
    commands.push("BT");
    commands.push(role === "meta" ? "0.25 0.28 0.33 rg" : "0 0 0 rg");
    commands.push(`/${font} ${size} Tf`);
    commands.push(`1 0 0 1 ${MARGIN_X} ${y.toFixed(2)} Tm`);
    commands.push(`(${escapePdfText(line)}) Tj`);
    commands.push("ET");
    y -= leading;
  }
  return y;
}

function textWidth(text: string, fontSize: number, bold: boolean): number {
  let units = 0;
  for (const char of text) {
    units += HELVETICA_UNITS[char] ?? 640;
  }
  return (units / 1000) * fontSize * (bold ? 1.08 : 1);
}

function escapePdfText(value: string): string {
  if ([...value].some((char) => char.charCodeAt(0) > 126)) {
    throw new Error("Sample PDF text must stay in basic ASCII");
  }
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

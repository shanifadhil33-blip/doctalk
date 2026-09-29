/** Small ASCII PDF writer used for the sample files. Not a general PDF library. */
export function buildPdf(pages: readonly (readonly string[])[]): Uint8Array {
  if (pages.length === 0) {
    throw new Error("A PDF needs at least one page");
  }

  const objects = new Map<number, string>();
  const pageIds: number[] = [];
  const contentIds: number[] = [];
  let nextId = 4;
  for (let index = 0; index < pages.length; index += 1) {
    pageIds.push(nextId);
    contentIds.push(nextId + 1);
    nextId += 2;
  }

  objects.set(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  pages.forEach((lines, index) => {
    const pageId = pageIds[index];
    const contentId = contentIds[index];
    if (!pageId || !contentId) {
      throw new Error("Missing PDF page id");
    }
    const stream = pageStream(lines);
    const length = new TextEncoder().encode(stream).length;
    objects.set(
      contentId,
      `<< /Length ${length} >>\nstream\n${stream}\nendstream`,
    );
    objects.set(
      pageId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentId} 0 R /Resources << /Font << /F1 3 0 R >> >> >>`,
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

function pageStream(lines: readonly string[]): string {
  const commands = ["BT", "/F1 11 Tf", "54 740 Td", "16 TL"];
  lines.forEach((line, index) => {
    const text = `(${escapePdfText(line)}) Tj`;
    if (index === 0) {
      commands.push(text);
      return;
    }
    commands.push("T*", text);
  });
  commands.push("ET");
  return commands.join("\n");
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

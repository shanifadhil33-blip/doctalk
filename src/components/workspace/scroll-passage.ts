export function collapseWithMap(value: string): { flat: string; map: number[] } {
  let flat = "";
  const map: number[] = [];
  let pendingSpace = false;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index] ?? "";
    if (/\s/.test(char)) {
      pendingSpace = flat.length > 0;
      continue;
    }
    if (pendingSpace) {
      flat += " ";
      map.push(index);
      pendingSpace = false;
    }
    flat += char.toLowerCase();
    map.push(index);
  }
  return { flat, map };
}

export function findExcerptInRoot(
  root: HTMLElement,
  excerpt: string,
): { node: Text; offset: number } | null {
  const needle = collapseWithMap(excerpt).flat.slice(0, 80);
  if (needle.length < 8) return null;

  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    if (current instanceof Text && current.data.trim()) nodes.push(current);
    current = walker.nextNode();
  }

  let combined = "";
  const spans: { node: Text; start: number; map: number[] }[] = [];
  for (const node of nodes) {
    const { flat, map } = collapseWithMap(node.data);
    if (!flat) continue;
    const joiner = combined.length > 0 ? 1 : 0;
    const start = combined.length + joiner;
    combined += `${joiner ? " " : ""}${flat}`;
    spans.push({ node, start, map });
  }

  const at = indexOfNeedle(combined, needle);
  if (at < 0) return null;
  for (let index = spans.length - 1; index >= 0; index -= 1) {
    const span = spans[index];
    if (!span || at < span.start) continue;
    const local = at - span.start;
    return { node: span.node, offset: span.map[local] ?? 0 };
  }
  return null;
}

function indexOfNeedle(combined: string, needle: string): number {
  const full = combined.indexOf(needle);
  if (full >= 0) return full;
  const shorter = needle.slice(0, 24);
  if (shorter.length < 8) return -1;
  return combined.indexOf(shorter);
}

export function scrollPane(pane: HTMLElement, top: number, behavior: ScrollBehavior) {
  if (typeof pane.scrollTo !== "function") return;
  pane.scrollTo({ top, behavior });
}

export function scrollOffsetWithin(pane: HTMLElement, target: HTMLElement): number {
  const top = target.getBoundingClientRect().top - pane.getBoundingClientRect().top + pane.scrollTop;
  return Math.max(0, top - 12);
}

export function scrollOffsetForText(pane: HTMLElement, node: Text, offset: number): number {
  const range = document.createRange();
  const safe = Math.min(Math.max(offset, 0), node.data.length);
  range.setStart(node, safe);
  range.collapse(true);
  const rect =
    typeof range.getBoundingClientRect === "function" ? range.getBoundingClientRect() : null;
  if (!rect || (rect.height === 0 && rect.top === 0)) {
    const parent = node.parentElement;
    if (parent) return scrollOffsetWithin(pane, parent);
    return pane.scrollTop;
  }
  const top = rect.top - pane.getBoundingClientRect().top + pane.scrollTop;
  return Math.max(0, top - 24);
}

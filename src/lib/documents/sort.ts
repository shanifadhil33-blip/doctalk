export type SortKey = "recent" | "name" | "pages";

export type SortableDocument = {
  title: string;
  addedOn: string;
  pageCount: number;
};

const sortKeys = new Set<SortKey>(["recent", "name", "pages"]);

export function parseSortKey(value: string | null | undefined): SortKey {
  if (value && sortKeys.has(value as SortKey)) return value as SortKey;
  return "recent";
}

/** Keep the current query and record the choice. The label does not wait on this navigation. */
export function hrefWithSort(pathname: string, search: string, sort: SortKey): string {
  const params = new URLSearchParams(search);
  params.set("sort", sort);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function compareDocuments(a: SortableDocument, b: SortableDocument, sort: SortKey): number {
  if (sort === "name") return a.title.localeCompare(b.title);
  if (sort === "pages") return b.pageCount - a.pageCount || a.title.localeCompare(b.title);
  return b.addedOn.localeCompare(a.addedOn) || a.title.localeCompare(b.title);
}

export function sortDocuments<T extends SortableDocument>(items: readonly T[], sort: SortKey): T[] {
  return [...items].sort((a, b) => compareDocuments(a, b, sort));
}

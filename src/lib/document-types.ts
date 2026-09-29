export type PageBlock =
  | { kind: "heading"; text: string; id?: string }
  | { kind: "subheading"; text: string; id?: string }
  | { kind: "paragraph"; text: string; id?: string }
  | {
      kind: "table";
      columns: string[];
      rows: string[][];
      id?: string;
    }
  | { kind: "total"; label: string; value: string; id?: string };

export type DocumentPage = {
  number: number;
  kicker: string;
  aside: string;
  blocks: PageBlock[];
};

export type Citation = {
  page: number;
  passageId: string;
  quote: string;
};

export type StoredAnswer = {
  keywords: string[];
  answer: string;
  citations: Citation[];
};

export type DemoDocument = {
  id: string;
  fileName: string;
  title: string;
  counterparty: string;
  kindLabel: string;
  preview: "invoice" | "statement" | "contract";
  pageCount: number;
  addedLabel: string;
  addedOn: string;
  pages: DocumentPage[];
  intro: {
    question: string;
    answer: string;
    citations: Citation[];
  };
  answers: StoredAnswer[];
};

export function blockText(block: PageBlock): string {
  if (block.kind === "table") {
    return [...block.columns, ...block.rows.flat()].join(" ");
  }
  if (block.kind === "total") {
    return `${block.label} ${block.value}`;
  }
  return block.text;
}

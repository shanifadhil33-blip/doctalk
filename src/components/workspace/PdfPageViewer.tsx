"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  ChevronLeftGlyph,
  ChevronRightGlyph,
  DownloadGlyph,
  MinusGlyph,
  PlusGlyph,
  SearchGlyph,
} from "@/components/icons";
import { iconButtonClass, toolbarButtonClass } from "@/components/button-styles";
import { blockText, type DocumentPage, type PageBlock } from "@/lib/document-types";

export function PdfPageViewer({
  fileName,
  pages,
  page,
  activePassageId,
  onPageChange,
}: {
  fileName: string;
  pages: DocumentPage[];
  page: number;
  activePassageId: string | null;
  onPageChange: (page: number, passageId: string | null) => void;
}) {
  const [zoom, setZoom] = useState(100);
  const [query, setQuery] = useState("");
  const [searchNote, setSearchNote] = useState("");
  const current = pages.find((item) => item.number === page) ?? pages[0];

  useEffect(() => {
    if (!activePassageId) {
      document.getElementById("pdf-scroll")?.scrollTo({ top: 0 });
      return;
    }
    const node = document.getElementById(activePassageId);
    if (!node) return;
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }, [activePassageId, page]);

  if (!current) {
    return (
      <p className="p-6 text-sm text-slate-600">This document has no pages.</p>
    );
  }

  function go(nextPage: number) {
    const match = pages.find((item) => item.number === nextPage);
    if (!match) return;
    onPageChange(match.number, null);
  }

  function search(event: FormEvent) {
    event.preventDefault();
    const needle = query.trim().toLowerCase();
    if (!needle) {
      setSearchNote("");
      return;
    }
    for (const item of pages) {
      for (const block of item.blocks) {
        if (blockText(block).toLowerCase().includes(needle)) {
          onPageChange(item.number, block.id ?? null);
          setSearchNote(`Found on page ${item.number}.`);
          return;
        }
      }
    }
    setSearchNote("No matches in this document.");
  }

  function downloadText() {
    const lines = pages.flatMap((item) => [
      item.kicker,
      item.aside,
      ...item.blocks.map((block) => blockText(block)),
      "",
    ]);
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName.replace(/\.pdf$/i, "") + ".txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full min-h-[70vh] w-full min-w-0 flex-1 flex-col lg:min-h-0">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
        <button
          type="button"
          className={iconButtonClass}
          aria-label="Previous page"
          disabled={current.number <= 1}
          onClick={() => go(current.number - 1)}
        >
          <ChevronLeftGlyph />
        </button>
        <p className="min-w-16 text-center text-sm tabular-nums text-slate-700" aria-live="polite">
          <span className="sr-only">Page </span>
          {current.number} / {pages.length}
        </p>
        <button
          type="button"
          className={iconButtonClass}
          aria-label="Next page"
          disabled={current.number >= pages.length}
          onClick={() => go(current.number + 1)}
        >
          <ChevronRightGlyph />
        </button>
        <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" aria-hidden="true" />
        <button
          type="button"
          className={iconButtonClass}
          aria-label="Zoom out"
          onClick={() => setZoom((value) => Math.max(80, value - 10))}
        >
          <MinusGlyph />
        </button>
        <span className="w-12 text-center text-sm tabular-nums text-slate-700">{zoom}%</span>
        <button
          type="button"
          className={iconButtonClass}
          aria-label="Zoom in"
          onClick={() => setZoom((value) => Math.min(150, value + 10))}
        >
          <PlusGlyph />
        </button>
        <button
          type="button"
          className={toolbarButtonClass}
          onClick={() => setZoom(100)}
        >
          Fit width
        </button>
        <form onSubmit={search} className="ml-auto flex min-w-[180px] flex-1 items-center gap-2 sm:max-w-xs" role="search">
          <label htmlFor="pdf-find" className="sr-only">
            Search in document
          </label>
          <span className="relative min-w-0 flex-1">
            <SearchGlyph className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="pdf-find"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find in document"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-2 text-sm transition-colors duration-150 hover:border-slate-400 focus-visible:border-[#4f46e5]"
            />
          </span>
        </form>
        <button type="button" className={iconButtonClass} aria-label="Download text" onClick={downloadText}>
          <DownloadGlyph />
        </button>
      </div>
      {searchNote ? (
        <p className="border-b border-slate-200 bg-white px-4 py-2 text-sm text-slate-600" role="status">
          {searchNote}
        </p>
      ) : null}
      <div id="pdf-scroll" className="min-h-0 flex-1 overflow-auto bg-[#eef0f3] px-3 py-6 sm:px-6">
        <article
          aria-label={`Page ${current.number}`}
          className="mx-auto w-full max-w-3xl bg-white px-5 py-8 text-slate-800 shadow-sm ring-1 ring-slate-200 sm:px-10"
          style={{ fontSize: `${zoom / 100}rem` }}
        >
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3 text-[0.72em] font-medium uppercase tracking-wide text-slate-400">
            <p>{current.kicker}</p>
            <p className="text-right">{current.aside}</p>
          </header>
          <div className="mt-6 space-y-4">
            {current.blocks.map((block, index) => (
              <BlockView
                key={block.id ?? `${current.number}-${index}`}
                block={block}
                active={Boolean(block.id && block.id === activePassageId)}
              />
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}

function BlockView({ block, active }: { block: PageBlock; active: boolean }) {
  if (block.kind === "heading") {
    return (
      <h2 id={block.id} className="text-[1.05em] font-semibold tracking-tight text-slate-950">
        {block.text}
      </h2>
    );
  }

  if (block.kind === "subheading") {
    return (
      <h3 id={block.id} className="text-[0.95em] font-semibold text-slate-950">
        {block.text}
      </h3>
    );
  }

  if (block.kind === "table") {
    return (
      <div id={block.id} className={active ? highlightClass : undefined}>
        {active ? <CitedLabel /> : null}
        <table className="w-full border-collapse text-[0.86em]">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              {block.columns.map((column) => (
                <th key={column} className="py-2 pr-3 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row) => (
              <tr key={row.join("|")} className="border-b border-slate-100">
                {row.map((cell, index) => (
                  <td key={`${cell}-${index}`} className="py-2 pr-3">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.kind === "total") {
    return (
      <p
        id={block.id}
        className={[
          "flex items-center justify-between gap-4 border-t border-slate-200 pt-3 text-[0.95em] font-semibold text-slate-950",
          active ? highlightClass : "",
        ].join(" ")}
      >
        <span>
          {active ? <CitedLabel /> : null}
          {block.label}
        </span>
        <span>{block.value}</span>
      </p>
    );
  }

  return (
    <p
      id={block.id}
      className={[
        "text-[0.92em] leading-relaxed",
        active ? highlightClass : "",
      ].join(" ")}
    >
      {active ? <CitedLabel /> : null}
      {block.text}
    </p>
  );
}

function CitedLabel() {
  return (
    <span className="mb-2 block text-[0.72em] font-medium uppercase tracking-wide text-[#8a5a12]">
      Cited in this answer
    </span>
  );
}

const highlightClass =
  "rounded-lg border border-[#f3e2a6] bg-[#fff8df] px-3 py-3 text-slate-900";

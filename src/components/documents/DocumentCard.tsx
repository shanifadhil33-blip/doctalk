"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { cardLinkClass } from "@/components/button-styles";
import {
  documentPreviewLines,
  knownPageCount,
  metaWithPageCount,
} from "@/lib/documents/preview";
import { isMarkdownFileName } from "@/lib/markdown/sections";

const PdfThumbnail = dynamic(
  () => import("@/components/documents/PdfThumbnail").then((mod) => mod.PdfThumbnail),
  { ssr: false, loading: () => <PreviewSkeleton /> },
);

export type DocumentCardModel = {
  id: string;
  title: string;
  counterparty: string;
  kindLabel: string;
  meta: string;
  status: string;
  preview: "invoice" | "statement" | "contract" | "file";
  fileName: string;
  pageCount?: number;
};

export function DocumentCard({
  item,
  layout,
  fileSrc,
}: {
  item: DocumentCardModel;
  layout: "grid" | "list";
  fileSrc?: string | null;
}) {
  const markdown = isMarkdownFileName(item.fileName);
  const lines = documentPreviewLines(item.id, item.fileName, item.status);
  const [loadedPages, setLoadedPages] = useState<number | null>(null);
  const pageCount =
    loadedPages ??
    knownPageCount(item.id, item.fileName, item.status) ??
    item.pageCount ??
    0;
  const meta = metaWithPageCount(item.meta, pageCount);
  const preview = (
    <DocumentPreview
      fileSrc={markdown ? null : fileSrc}
      lines={lines.length > 0 ? lines : [item.fileName]}
      kicker={markdown ? "Markdown" : "PDF"}
      compact={layout === "list"}
      onPageCount={setLoadedPages}
    />
  );

  if (layout === "list") {
    return (
      <Link
        href={`/documents/${item.id}`}
        aria-label={`Open ${item.title}`}
        className={`${cardLinkClass} flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between`}
      >
        <span className="flex min-w-0 items-start gap-3">
          {preview}
          <span className="min-w-0">
            <span className="text-xs font-medium text-slate-500">{item.kindLabel}</span>
            <span className="mt-1 block text-base font-semibold text-slate-950">
              {item.title}
            </span>
            <span className="mt-0.5 block text-sm text-slate-600">{item.counterparty}</span>
            <span className="mt-1 block text-sm text-slate-500">{meta}</span>
          </span>
        </span>
        <span className="text-sm font-medium text-[#4338ca]">Open document</span>
      </Link>
    );
  }

  return (
    <Link
      href={`/documents/${item.id}`}
      aria-label={`Open ${item.title}`}
      className={`${cardLinkClass} flex h-full flex-col overflow-hidden rounded-2xl`}
    >
      {preview}
      <span className="flex flex-1 flex-col p-4">
        <span className="w-fit rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {item.kindLabel}
        </span>
        <span className="mt-3 block text-lg font-semibold leading-snug text-slate-950">
          {item.title}
        </span>
        <span className="mt-1 block text-sm text-slate-600">{item.counterparty}</span>
        <span className="mt-2 block text-sm text-slate-500">{meta}</span>
        <span className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-sm">
          <span className="text-slate-500">{item.status}</span>
          <span className="font-medium text-[#4338ca]">Open document</span>
        </span>
      </span>
    </Link>
  );
}

function DocumentPreview({
  fileSrc,
  lines,
  kicker,
  compact,
  onPageCount,
}: {
  fileSrc?: string | null;
  lines: string[];
  kicker: string;
  compact: boolean;
  onPageCount: (pageCount: number) => void;
}) {
  const frameRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(compact ? 72 : 280);
  const sheet = <TextSheet lines={lines} compact={compact} kicker={kicker} />;

  useEffect(() => {
    const node = frameRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const update = () => {
      const next = Math.floor(node.clientWidth);
      if (next > 0) setWidth(next);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <span
      ref={frameRef}
      aria-hidden="true"
      className={
        compact
          ? "pointer-events-none block h-[92px] w-[72px] shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white"
          : "pointer-events-none block h-[210px] overflow-hidden border-b border-slate-200 bg-[#f3f4f6]"
      }
    >
      {fileSrc ? (
        <PdfThumbnail
          fileSrc={fileSrc}
          width={width}
          fallback={sheet}
          onPageCount={onPageCount}
        />
      ) : (
        sheet
      )}
    </span>
  );
}

function TextSheet({
  lines,
  compact,
  kicker,
}: {
  lines: string[];
  compact: boolean;
  kicker: string;
}) {
  return (
    <span className={compact ? "block h-full bg-white px-1.5 py-1.5" : "block h-full bg-white px-4 py-4"}>
      <span className="block text-[9px] font-semibold uppercase tracking-wide text-slate-400">
        {kicker}
      </span>
      {lines.slice(0, compact ? 4 : 6).map((line, index) => (
        <span
          key={`${index}-${line}`}
          className={
            compact
              ? "mt-1 block truncate text-[8px] leading-tight text-slate-700"
              : "mt-1.5 block text-[12px] leading-snug text-slate-800"
          }
        >
          {line}
        </span>
      ))}
    </span>
  );
}

function PreviewSkeleton() {
  return <span className="block h-full min-h-24 w-full animate-pulse bg-slate-100" />;
}

"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { cardLinkClass, controlFocusClass } from "@/components/button-styles";
import { MoreGlyph } from "@/components/icons";
import { DeleteDocumentDialog } from "@/components/documents/DeleteDocumentDialog";
import {
  addedLabel,
  DocumentInfoDialog,
} from "@/components/documents/DocumentInfoDialog";
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
  addedOn?: string;
};

export function DocumentCard({
  item,
  layout,
  fileSrc,
  menu = false,
  onDelete,
}: {
  item: DocumentCardModel;
  layout: "grid" | "list";
  fileSrc?: string | null;
  /** Signed-in dashboard cards get a menu. The card link still opens the document. */
  menu?: boolean;
  onDelete?: (id: string) => Promise<void>;
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const canDelete = Boolean(onDelete) && item.status !== "Sample";
  const preview = (
    <DocumentPreview
      fileSrc={markdown ? null : fileSrc}
      lines={lines.length > 0 ? lines : [item.fileName]}
      kicker={markdown ? "Markdown" : "PDF"}
      compact={layout === "list"}
      onPageCount={setLoadedPages}
    />
  );

  const actions = menu ? (
    <CardMenu
      title={item.title}
      open={menuOpen}
      menuRef={menuRef}
      canDelete={canDelete}
      onToggle={() => setMenuOpen((current) => !current)}
      onClose={() => setMenuOpen(false)}
      onInfo={() => {
        setMenuOpen(false);
        setInfoOpen(true);
      }}
      onDelete={() => {
        setMenuOpen(false);
        setDeleteError(null);
        setConfirmOpen(true);
      }}
    />
  ) : null;

  const dialogs = (
    <>
      <DocumentInfoDialog
        open={infoOpen}
        info={{
          name: item.title,
          fileName: item.fileName,
          type: item.kindLabel,
          added: addedLabel(item.addedOn, item.meta),
          status: item.status,
          pages: pageCount > 0 ? pageCount : undefined,
        }}
        onClose={() => setInfoOpen(false)}
      />
      <DeleteDocumentDialog
        open={confirmOpen}
        fileName={item.fileName}
        pending={deletePending}
        error={deleteError}
        onCancel={() => {
          if (deletePending) return;
          setConfirmOpen(false);
        }}
        onConfirm={() => {
          if (!onDelete || deletePending) return;
          setDeletePending(true);
          setDeleteError(null);
          void onDelete(item.id)
            .then(() => setConfirmOpen(false))
            .catch((deleteFailure: unknown) => {
              setDeleteError(
                deleteFailure instanceof Error
                  ? deleteFailure.message
                  : "Could not delete that document.",
              );
            })
            .finally(() => setDeletePending(false));
        }}
      />
    </>
  );

  if (layout === "list") {
    return (
      <div className="relative">
        <Link
          href={`/documents/${item.id}`}
          aria-label={`Open ${item.title}`}
          className={`${cardLinkClass} flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center ${menu ? "sm:pr-14" : ""}`}
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
        </Link>
        {actions}
        {dialogs}
      </div>
    );
  }

  return (
    <div className="relative h-full">
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
          <span className="mt-4 block border-t border-slate-100 pt-3 text-sm text-slate-500">
            {item.status}
          </span>
        </span>
      </Link>
      {actions}
      {dialogs}
    </div>
  );
}

function CardMenu({
  title,
  open,
  menuRef,
  canDelete,
  onToggle,
  onClose,
  onInfo,
  onDelete,
}: {
  title: string;
  open: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  canDelete: boolean;
  onToggle: () => void;
  onClose: () => void;
  onInfo: () => void;
  onDelete: () => void;
}) {
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) onClose();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, menuRef, onClose]);

  return (
    <div ref={menuRef} className="absolute right-2 top-2 z-20">
      <button
        type="button"
        className={[
          "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm",
          "transition-colors duration-150 ease-out motion-reduce:transition-none",
          "hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200",
          controlFocusClass,
        ].join(" ")}
        aria-label={`Actions for ${title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToggle();
        }}
      >
        <MoreGlyph className="h-4 w-4" />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={`Actions for ${title}`}
          className="absolute right-0 top-10 w-36 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            className={menuItemClass}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onInfo();
            }}
          >
            Info
          </button>
          {canDelete ? (
            <button
              type="button"
              role="menuitem"
              className={menuItemClass}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDelete();
              }}
            >
              Delete
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const menuItemClass = [
  "flex w-full cursor-pointer px-3 py-2 text-left text-sm text-slate-800",
  "transition-colors duration-150 ease-out motion-reduce:transition-none",
  "hover:bg-slate-100 active:bg-slate-200",
  controlFocusClass,
].join(" ");

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

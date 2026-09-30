"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { GridGlyph, ListGlyph, SearchGlyph, UploadGlyph } from "@/components/icons";
import { controlFocusClass, primaryButtonClass } from "@/components/button-styles";
import { SiteFooter } from "@/components/SiteFooter";
import { SkipLink } from "@/components/SkipLink";
import { TopBar } from "@/components/TopBar";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { documentPreviewSrc } from "@/lib/documents/preview";
import { UploadDialog } from "@/components/documents/UploadDialog";
import type { ListedDocument } from "@/lib/document-types";
import { uploadDocumentFromBrowser } from "@/lib/documents/client-upload";
import { isMarkdownFileName } from "@/lib/markdown/sections";
import { isListedDocumentList } from "@/lib/documents/list";
import {
  readSessionUploads,
  recallUploadFile,
  rememberUploadFile,
  saveSessionUpload,
  stampUpload,
  type SessionUpload,
} from "@/lib/session-uploads";

type SortKey = "recent" | "name" | "pages";

export function DocumentsDashboard({
  documents,
  source,
  signedIn,
  headerAccount,
  bannerAccount,
  initialUploadOpen = false,
}: {
  documents: ListedDocument[];
  source: "demo" | "library";
  signedIn: boolean;
  headerAccount: ReactNode;
  bannerAccount?: ReactNode;
  initialUploadOpen?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [uploadOpen, setUploadOpen] = useState(initialUploadOpen);
  const [uploads, setUploads] = useState<SessionUpload[]>([]);
  const [localPreviewUrls, setLocalPreviewUrls] = useState<Record<string, string>>({});
  const [remoteDocuments, setRemoteDocuments] = useState<ListedDocument[] | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    setUploads(readSessionUploads());
  }, []);

  useEffect(() => {
    const created: string[] = [];
    const next: Record<string, string> = {};
    for (const upload of uploads) {
      const file = recallUploadFile(upload.id);
      if (!file) continue;
      const url = URL.createObjectURL(file);
      created.push(url);
      next[upload.id] = url;
    }
    setLocalPreviewUrls(next);
    return () => {
      for (const url of created) URL.revokeObjectURL(url);
    };
  }, [uploads]);

  useEffect(() => {
    if (source !== "library") return;
    const controller = new AbortController();
    void fetch("/api/documents", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const payload: unknown = await response.json();
        if (!isListedDocumentList(payload)) return;
        setRemoteDocuments(payload.documents);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [source, reloadToken]);

  const cards = useMemo(() => {
    const samples = source === "library" ? (remoteDocuments ?? documents) : documents;

    const local: ListedDocument[] =
      source === "library"
        ? []
        : uploads.map((upload) => ({
        id: upload.id,
        title: upload.fileName.replace(/\.(pdf|markdown|md)$/i, ""),
        counterparty: "Uploaded in this browser",
        kindLabel: isMarkdownFileName(upload.fileName) ? "Markdown" : "PDF",
        meta: `Added ${upload.addedLabel}`,
        status: "Not indexed yet",
        preview: "file",
        fileName: upload.fileName,
        addedOn: upload.addedOn,
        pageCount: 0,
      }));

    const needle = query.trim().toLowerCase();
    const filtered = [...local, ...samples].filter((item) => {
      if (!needle) return true;
      return (
        item.title.toLowerCase().includes(needle) ||
        item.counterparty.toLowerCase().includes(needle) ||
        item.fileName.toLowerCase().includes(needle) ||
        item.kindLabel.toLowerCase().includes(needle)
      );
    });

    filtered.sort((a, b) => {
      if (sort === "name") return a.title.localeCompare(b.title);
      if (sort === "pages") return b.pageCount - a.pageCount || a.title.localeCompare(b.title);
      return b.addedOn.localeCompare(a.addedOn) || a.title.localeCompare(b.title);
    });

    return filtered;
  }, [documents, remoteDocuments, source, uploads, query, sort]);

  function closeUpload() {
    setUploadOpen(false);
    if (initialUploadOpen) router.replace("/documents");
  }

  async function uploadToServer(file: File) {
    const { id } = await uploadDocumentFromBrowser(file);
    setUploadOpen(false);
    setReloadToken((value) => value + 1);
    router.push(`/documents/${id}`);
    router.refresh();
  }

  function openUploadedFile(file: File) {
    const id = `local-${crypto.randomUUID()}`;
    const stamped = stampUpload(new Date());
    const upload = {
      id,
      fileName: file.name,
      sizeBytes: file.size,
      addedOn: stamped.addedOn,
      addedLabel: stamped.addedLabel,
    };
    saveSessionUpload(upload);
    rememberUploadFile(id, file);
    setUploads((current) => [upload, ...current.filter((item) => item.id !== id)]);
    setUploadOpen(false);
    router.push(`/documents/${id}`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f6f8]">
      <SkipLink />
      <TopBar
        actions={
          <>
            {headerAccount}
            <button
              type="button"
              className={primaryButtonClass}
              onClick={() => setUploadOpen(true)}
            >
              <UploadGlyph />
              Upload PDF or Markdown
            </button>
          </>
        }
      />
      {source === "demo" || !signedIn ? (
        <div className="border-b border-[#f0e2b4] bg-[#fff8e6] px-4 py-3 text-sm text-[#5c4816] sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#d6a326]" aria-hidden="true" />
              {source === "demo"
                ? signedIn
                  ? "You're viewing demo documents."
                  : "You're viewing demo documents. Sign in to upload your own."
                : "Sign in to see documents you add."}
            </p>
            {bannerAccount}
          </div>
        </div>
      ) : null}

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Documents</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Inspect contracts, billing statements, and medical invoices.
        </p>

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <label htmlFor="document-search" className="sr-only">
              Search by document name or counterparty
            </label>
            <SearchGlyph className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="document-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by document name or counterparty..."
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 transition-colors duration-150 hover:border-slate-400 focus-visible:border-[#4f46e5]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="document-sort" className="shrink-0 text-sm text-slate-500">
              Sort by
            </label>
            <select
              id="document-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className={`h-11 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 transition-colors duration-150 hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100 ${controlFocusClass}`}
            >
              <option value="recent">Recently added</option>
              <option value="name">Name</option>
              <option value="pages">Page count</option>
            </select>
            <div className="flex rounded-lg border border-slate-200 bg-white p-1" role="group" aria-label="Layout">
              <button
                type="button"
                aria-pressed={layout === "grid"}
                aria-label="Grid view"
                className={layoutButtonClass(layout === "grid")}
                onClick={() => setLayout("grid")}
              >
                <GridGlyph />
              </button>
              <button
                type="button"
                aria-pressed={layout === "list"}
                aria-label="List view"
                className={layoutButtonClass(layout === "list")}
                onClick={() => setLayout("list")}
              >
                <ListGlyph />
              </button>
            </div>
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {cards.length === 0 ? "No documents" : `${cards.length} documents`}
        </p>

        {cards.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <h2 className="text-base font-semibold text-slate-950">
              {(source === "library"
                ? (remoteDocuments ?? documents).length
                : documents.length + uploads.length) === 0 && !query
                ? "No documents yet"
                : "No matching documents"}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
              {query
                ? "Try a different name or counterparty."
                : "Upload a PDF or Markdown file to open it here."}
            </p>
            {query ? (
              <button
                type="button"
                className={`${primaryButtonClass} mt-5`}
                onClick={() => setQuery("")}
              >
                Clear search
              </button>
            ) : (
              <button
                type="button"
                className={`${primaryButtonClass} mt-5`}
                onClick={() => setUploadOpen(true)}
              >
                Upload PDF or Markdown
              </button>
            )}
          </div>
        ) : (
          <ul
            className={
              layout === "grid"
                ? "mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                : "mt-6 flex flex-col gap-3"
            }
          >
            {cards.map((item) => (
              <li key={item.id}>
                <DocumentCard
                  item={item}
                  layout={layout}
                  fileSrc={
                    localPreviewUrls[item.id] ??
                    documentPreviewSrc(item.id, item.fileName, item.status)
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
      <UploadDialog
        open={uploadOpen}
        onClose={closeUpload}
        onOpenDocument={openUploadedFile}
        uploadMode={source === "library" ? "server" : "local"}
        signedIn={signedIn}
        onUpload={source === "library" ? uploadToServer : undefined}
      />
    </div>
  );
}

function layoutButtonClass(active: boolean): string {
  return [
    "grid h-9 w-9 cursor-pointer place-items-center rounded-md transition-colors duration-150 ease-out motion-reduce:transition-none",
    controlFocusClass,
    "active:bg-slate-200",
    active
      ? "bg-slate-200 text-slate-950 hover:bg-slate-300"
      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");
}

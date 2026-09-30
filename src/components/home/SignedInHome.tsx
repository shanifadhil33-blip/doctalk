"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UploadGlyph } from "@/components/icons";
import { RollingMark } from "@/components/RollingMark";
import { controlFocusClass, primaryButtonClass } from "@/components/button-styles";
import { SiteFooter } from "@/components/SiteFooter";
import { SkipLink } from "@/components/SkipLink";
import { TopBar } from "@/components/TopBar";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { documentPreviewSrc } from "@/lib/documents/preview";
import type { ListedDocument } from "@/lib/document-types";
import { uploadDocumentFromBrowser } from "@/lib/documents/client-upload";
import { isMarkdownFileName } from "@/lib/markdown/sections";
import type { AskedQuestion } from "@/lib/questions/history";
import {
  readSessionUploads,
  recallUploadFile,
  rememberUploadFile,
  saveSessionUpload,
  stampUpload,
  type SessionUpload,
} from "@/lib/session-uploads";
import { validateDocumentFile } from "@/lib/upload-validation";

export function SignedInHome({
  source,
  owned,
  samples,
  questions,
  headerAccount,
}: {
  source: "demo" | "library";
  owned: ListedDocument[];
  samples: ListedDocument[];
  questions: AskedQuestion[];
  headerAccount: ReactNode;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<SessionUpload[]>([]);
  const [localPreviewUrls, setLocalPreviewUrls] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (source !== "demo") return;
    setUploads(readSessionUploads());
  }, [source]);

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

  const localDocuments: ListedDocument[] =
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

  const yourDocuments = [...localDocuments, ...owned];

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
    router.push(`/documents/${id}`);
  }

  async function uploadToServer(file: File) {
    setBusy(true);
    setError(null);
    setStatus("Uploading.");
    try {
      const { id } = await uploadDocumentFromBrowser(file);
      setStatus("Opening the document.");
      router.push(`/documents/${id}`);
      router.refresh();
    } catch (uploadError: unknown) {
      const message =
        uploadError instanceof Error ? uploadError.message : "Upload failed. Try again later.";
      setError(message);
      setStatus(message);
    } finally {
      setBusy(false);
    }
  }

  function takeFile(file: File | undefined) {
    if (!file || busy) return;
    if (inputRef.current) inputRef.current.value = "";
    const result = validateDocumentFile(file);
    if (!result.ok) {
      setError(result.message);
      setStatus(result.message);
      return;
    }
    setError(null);
    if (source === "library") {
      void uploadToServer(file);
      return;
    }
    openUploadedFile(file);
  }

  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden bg-[#f5f6f8]">
      <SkipLink />
      <TopBar
        actions={
          <>
            <button
              type="button"
              className={primaryButtonClass}
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              <UploadGlyph />
              Upload PDF or Markdown
            </button>
            {headerAccount}
          </>
        }
      />
      <main id="main" className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Your documents</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Upload a PDF or Markdown file, then ask a question and open where it came from.
        </p>

        <div className="mt-6">
          <label
            htmlFor="home-pdf"
            onDragEnter={(event) => {
              event.preventDefault();
              if (!busy) setDragOver(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              if (!busy) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(false);
              takeFile(event.dataTransfer.files[0]);
            }}
            aria-busy={busy}
            className={[
              "flex min-w-0 cursor-pointer flex-col items-center rounded-2xl border border-dashed px-4 py-10 text-center transition-colors duration-150",
              "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#4f46e5]",
              busy ? "cursor-wait border-slate-200 bg-slate-50" : "",
              !busy && dragOver
                ? "border-[#4f46e5] bg-[#f5f4ff]"
                : !busy
                  ? "border-slate-300 bg-white hover:border-slate-400 hover:bg-[#f8f9fb] active:bg-slate-100"
                  : "",
            ].join(" ")}
          >
            <span className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-600">
              {busy ? <RollingMark className="h-5 w-5" /> : <UploadGlyph className="h-5 w-5" />}
            </span>
            <span className="mt-3 text-base font-semibold text-slate-950">
              {busy ? "Uploading" : "Upload a PDF or Markdown file"}
            </span>
            <span className="mt-1 max-w-md text-sm text-slate-600">
              {busy ? "Keep this page open until the file is ready to open." : "Drop a PDF or Markdown file here, or choose a file."}
            </span>
            <span id="home-upload-hint" className="mt-2 text-xs text-slate-500">
              {source === "library"
                ? "PDF or Markdown, up to 10 MB. 5 documents per account."
                : "PDF or Markdown, up to 10 MB."}
            </span>
            <input
              ref={inputRef}
              id="home-pdf"
              type="file"
              accept="application/pdf,.pdf,text/markdown,.md,.markdown"
              className="sr-only"
              aria-label="Choose a PDF or Markdown file"
              aria-describedby={error ? "home-upload-error" : "home-upload-hint"}
              aria-invalid={error ? true : undefined}
              disabled={busy}
              onChange={(event) => takeFile(event.target.files?.[0])}
            />
          </label>
          <p className="sr-only" aria-live="polite">
            {status}
          </p>
          {error ? (
            <p id="home-upload-error" role="alert" className="mt-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          {busy ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-600" role="status">
              <RollingMark />
              Uploading
            </p>
          ) : null}
        </div>

        <section className="mt-10" aria-labelledby="your-documents-heading">
          <h2 id="your-documents-heading" className="text-lg font-semibold text-slate-950">
            Documents
          </h2>
          {yourDocuments.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">You have no documents yet.</p>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {yourDocuments.map((item) => (
                <li key={item.id} className="min-w-0">
                  <DocumentCard
                    item={item}
                    layout="grid"
                    fileSrc={
                      localPreviewUrls[item.id] ??
                      documentPreviewSrc(item.id, item.fileName, item.status)
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="questions" className="mt-10 scroll-mt-6" aria-labelledby="questions-heading">
          <h2 id="questions-heading" className="text-lg font-semibold text-slate-950">
            Questions
          </h2>
          {questions.length === 0 ? (
            <p className="mt-3 max-w-xl text-sm text-slate-600">
              Questions you ask will show up here.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {questions.map((item) => (
                <li key={item.id} className="min-w-0">
                  <QuestionRow item={item} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {samples.length > 0 ? (
          <section className="mt-10" aria-labelledby="samples-heading">
            <h2 id="samples-heading" className="text-lg font-semibold text-slate-950">
              Sample documents
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-600">
              Public samples you can still open.
            </p>
            <ul className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {samples.map((item) => (
                <li key={item.id} className="min-w-0">
                  <Link
                    href={`/documents/${item.id}`}
                    className={[
                      "flex min-w-0 items-center justify-between gap-3 px-4 py-3",
                      "transition-colors duration-150 ease-out motion-reduce:transition-none",
                      "hover:bg-[#f8f9fb] active:bg-slate-100",
                      controlFocusClass,
                    ].join(" ")}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-950">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-slate-500">
                        {item.kindLabel} · Sample
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-medium text-[#4338ca]">Open</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}

function QuestionRow({ item }: { item: AskedQuestion }) {
  const body = (
    <>
      <span className="block break-words text-sm font-medium text-slate-950">{item.question}</span>
      <span className="mt-1 block break-words text-sm text-slate-500">
        {item.documentTitle} · {item.askedLabel}
      </span>
      <span className="mt-2 line-clamp-2 block break-words text-sm text-slate-600">{item.answer}</span>
    </>
  );

  if (!item.documentId) {
    return <div className="min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3">{body}</div>;
  }

  return (
    <Link
      href={`/documents/${item.documentId}`}
      className={[
        "block min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3",
        "transition-colors duration-150 ease-out motion-reduce:transition-none",
        "hover:border-slate-300 hover:bg-[#f8f9fb] active:bg-slate-100",
        controlFocusClass,
      ].join(" ")}
    >
      {body}
    </Link>
  );
}

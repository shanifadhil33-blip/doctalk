"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UploadGlyph } from "@/components/icons";
import { RollingMark } from "@/components/RollingMark";
import { controlFocusClass, primaryButtonClass, secondaryButtonClass } from "@/components/button-styles";
import { rememberListScroll, useRestoreListScroll } from "@/components/list-scroll";
import { SiteFooter } from "@/components/SiteFooter";
import { SkipLink } from "@/components/SkipLink";
import { TopBar } from "@/components/TopBar";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { documentPreviewSrc } from "@/lib/documents/preview";
import type { ListedDocument } from "@/lib/document-types";
import { DocumentUploadError, uploadDocumentFromBrowser } from "@/lib/documents/client-upload";
import { isMarkdownFileName } from "@/lib/markdown/sections";
import type { AskedQuestion } from "@/lib/questions/history";
import {
  readSessionUploads,
  recallUploadFile,
  rememberUploadFile,
  removeSessionUpload,
  saveSessionUpload,
  stampUpload,
  type SessionUpload,
} from "@/lib/session-uploads";
import { isPublicSample } from "@/lib/documents/samples";
import { validateDocumentFile } from "@/lib/upload-validation";

export function SignedInHome({
  source,
  owned,
  questions,
  headerAccount,
}: {
  source: "demo" | "library";
  owned: ListedDocument[];
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
  const [failedFile, setFailedFile] = useState<File | null>(null);
  const [failedReadId, setFailedReadId] = useState<string | null>(null);
  const [phaseLabel, setPhaseLabel] = useState("Uploading");
  useRestoreListScroll("home");

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

  const yourDocuments = [...localDocuments, ...owned].filter((item) => !isPublicSample(item));

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
    setFailedFile(null);
    setFailedReadId(null);
    setPhaseLabel("Uploading");
    setStatus("Uploading.");
    try {
      const { id } = await uploadDocumentFromBrowser(file, (phase) => {
        const label = phase === "reading" ? "Reading the file" : "Uploading";
        setPhaseLabel(label);
        setStatus(label);
      });
      setStatus("Opening the document.");
      router.push(`/documents/${id}`);
      router.refresh();
    } catch (uploadError: unknown) {
      const message =
        uploadError instanceof Error ? uploadError.message : "Upload failed. Try again later.";
      const documentId = uploadError instanceof DocumentUploadError ? uploadError.documentId : undefined;
      setError(message);
      setStatus(message);
      if (documentId) {
        setFailedReadId(documentId);
        router.refresh();
      } else {
        setFailedFile(file);
      }
    } finally {
      setBusy(false);
    }
  }

  async function retryReading(documentId: string) {
    setBusy(true);
    setError(null);
    setPhaseLabel("Reading the file");
    setStatus("Reading the file.");
    try {
      const response = await fetch(`/api/documents/${documentId}`, { method: "POST" });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "This document could not be read.";
        setError(message);
        setStatus(message);
        setFailedReadId(documentId);
        return;
      }
      setFailedReadId(null);
      router.push(`/documents/${documentId}`);
      router.refresh();
    } catch {
      setError("This document could not be read.");
      setStatus("This document could not be read.");
      setFailedReadId(documentId);
    } finally {
      setBusy(false);
    }
  }

  async function deleteDocument(id: string) {
    if (id.startsWith("local-") || source === "demo") {
      removeSessionUpload(id);
      setUploads((current) => current.filter((item) => item.id !== id));
      return;
    }
    const response = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload: unknown = await response.json().catch(() => null);
      const message =
        payload &&
        typeof payload === "object" &&
        "error" in payload &&
        typeof payload.error === "string"
          ? payload.error
          : "Could not delete that document.";
      throw new Error(message);
    }
    router.refresh();
  }

  function takeFile(file: File | undefined) {
    if (!file || busy) return;
    if (inputRef.current) inputRef.current.value = "";
    const result = validateDocumentFile(file);
    if (!result.ok) {
      setFailedFile(null);
      setFailedReadId(null);
      setError(result.message);
      setStatus(result.message);
      return;
    }
    setError(null);
    setFailedFile(null);
    setFailedReadId(null);
    if (source === "library") {
      void uploadToServer(file);
      return;
    }
    openUploadedFile(file);
  }

  return (
    <div className="flex min-h-dvh min-w-0 max-w-full flex-col overflow-x-hidden bg-[#f5f6f8]">
      <SkipLink />
      <TopBar
        actions={
          <>
            <button
              type="button"
              className={primaryButtonClass}
              aria-label="Upload PDF or Markdown"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              <UploadGlyph />
              <span className="hidden sm:inline">Upload PDF or Markdown</span>
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
              {busy ? phaseLabel : "Upload a PDF or Markdown file"}
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
            <div id="home-upload-error" role="alert" className="mt-3 flex flex-col items-start gap-2">
              <p className="text-sm text-red-700">{error}</p>
              {failedFile ? (
                <button type="button" className={secondaryButtonClass} onClick={() => takeFile(failedFile)}>
                  Retry upload
                </button>
              ) : null}
              {failedReadId ? (
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => void retryReading(failedReadId)}
                  disabled={busy}
                >
                  Retry
                </button>
              ) : null}
            </div>
          ) : null}
          {busy ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-600" role="status">
              <RollingMark />
              {phaseLabel}
            </p>
          ) : null}
        </div>

        <section className="mt-10" aria-labelledby="your-documents-heading">
          <h2 id="your-documents-heading" className="text-lg font-semibold text-slate-950">
            Documents
          </h2>
          {yourDocuments.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
              <h3 className="text-base font-semibold text-slate-950">No documents yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
                Upload a PDF or Markdown file to ask a question about it.
              </p>
              <button
                type="button"
                className={`${primaryButtonClass} mt-5`}
                onClick={() => inputRef.current?.click()}
                disabled={busy}
              >
                <UploadGlyph />
                Upload your first document
              </button>
            </div>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {yourDocuments.map((item) => (
                <li key={item.id} className="min-w-0">
                  <DocumentCard
                    item={item}
                    layout="grid"
                    menu
                    listKey="home"
                    onDelete={item.status === "Sample" ? undefined : deleteDocument}
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
              Questions you ask will show up here. Open a document and ask a question.
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

        <p className="mt-6">
          <Link
            href="/documents?demo=1"
            prefetch={true}
            className="inline-flex min-h-11 items-center text-sm font-medium text-slate-600 underline-offset-2 hover:text-slate-950 hover:underline"
          >
            Try the public demo
          </Link>
        </p>
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
      prefetch={true}
      onClick={() => rememberListScroll("home")}
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

"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  dialogBackdropClass,
  dialogPanelClass,
  ghostIconButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/button-styles";
import { OverlayPortal } from "@/components/OverlayPortal";
import { RollingMark } from "@/components/RollingMark";
import { CloseGlyph, UploadGlyph } from "@/components/icons";
import { useDialog } from "@/components/useDialog";
import { DocumentUploadError } from "@/lib/documents/client-upload";
import { isMarkdownFileName } from "@/lib/markdown/sections";
import { formatFileSize, validateDocumentFile } from "@/lib/upload-validation";

type UploadPhase = "idle" | "checking" | "ready";

export function UploadDialog({
  open,
  onClose,
  onOpenDocument,
  uploadMode = "local",
  signedIn = true,
  onUpload,
}: {
  open: boolean;
  onClose: () => void;
  onOpenDocument: (file: File) => void;
  uploadMode?: "local" | "server";
  signedIn?: boolean;
  onUpload?: (file: File) => Promise<void>;
}) {
  const router = useRouter();
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [busy, setBusy] = useState(false);
  const [failedReadId, setFailedReadId] = useState<string | null>(null);
  const serverMode = uploadMode === "server";
  const dialogRef = useDialog(open, () => {
    if (busy) return;
    onClose();
  }, { locked: busy });

  useEffect(() => {
    if (open) return;
    setFile(null);
    setError(null);
    setDragOver(false);
    setPhase("idle");
    setBusy(false);
    setFailedReadId(null);
  }, [open]);

  useEffect(() => {
    if (serverMode || phase !== "checking") return;
    const timer = window.setTimeout(() => setPhase("ready"), 400);
    return () => window.clearTimeout(timer);
  }, [phase, serverMode]);

  function takeFile(next: File | undefined) {
    if (!next) return;
    const result = validateDocumentFile(next);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    setFailedReadId(null);
    setFile(next);
    setPhase(serverMode ? "idle" : "checking");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function sendFile() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (failedReadId) {
        const response = await fetch(`/api/documents/${failedReadId}`, { method: "POST" });
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
          return;
        }
        const id = failedReadId;
        setFailedReadId(null);
        onClose();
        router.push(`/documents/${id}`);
        router.refresh();
        return;
      }
      if (!file || !onUpload) return;
      await onUpload(file);
    } catch (uploadError: unknown) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed. Try again later.",
      );
      setFailedReadId(
        uploadError instanceof DocumentUploadError ? (uploadError.documentId ?? null) : null,
      );
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  const ready = phase === "ready";

  return (
    <OverlayPortal>
    <div
      className={dialogBackdropClass}
      onPointerDown={(event) => {
        if (busy) return;
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`${dialogPanelClass} max-w-lg`}
      >
        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-slate-200 px-5 py-4">
          <h2 id={titleId} className="min-w-0 break-words text-lg font-semibold text-slate-950">
            Upload a PDF or Markdown file
          </h2>
          <button
            type="button"
            className={ghostIconButtonClass}
            onClick={onClose}
            aria-label="Close upload dialog"
          >
            <CloseGlyph />
          </button>
        </div>

        <div className="min-h-0 space-y-4 overflow-y-auto px-5 py-5">
          {serverMode && !signedIn ? (
            <div className="rounded-xl border border-slate-200 bg-[#f8f9fb] px-4 py-8 text-center">
              <p className="text-sm text-slate-700">Sign in to upload a PDF or Markdown file.</p>
              <Link href="/sign-in?callbackUrl=%2Fdocuments" className={`${primaryButtonClass} mt-4`}>
                Sign in
              </Link>
            </div>
          ) : (
          <label
            htmlFor="pdf-file"
            onDragEnter={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(false);
              takeFile(event.dataTransfer.files[0]);
            }}
            className={[
              "flex cursor-pointer flex-col items-center rounded-xl border border-dashed px-4 py-8 text-center transition-colors duration-150 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#4f46e5]",
              dragOver
                ? "border-[#4f46e5] bg-[#f5f4ff]"
                : "border-slate-300 bg-[#f8f9fb] hover:border-slate-400 hover:bg-white active:bg-slate-100",
            ].join(" ")}
          >
            <span className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-600">
              <UploadGlyph />
            </span>
            <span className="mt-3 text-sm text-slate-700">
              Drop a PDF or Markdown file here or{" "}
              <span className="font-medium text-[#4338ca] underline">browse</span>
            </span>
            <span id="upload-hint" className="mt-1 text-xs text-slate-500">
              {serverMode
                ? "PDF or Markdown, up to 10 MB. 5 documents per account."
                : "PDF or Markdown, up to 10 MB."}
            </span>
            <input
              ref={inputRef}
              id="pdf-file"
              type="file"
              accept="application/pdf,.pdf,text/markdown,.md,.markdown"
              className="sr-only"
              aria-label="Choose a PDF or Markdown file"
              aria-describedby={error ? "upload-error" : "upload-hint"}
              aria-invalid={error ? true : undefined}
              onChange={(event) => takeFile(event.target.files?.[0])}
            />
          </label>
          )}

          {error ? (
            <div id="upload-error" role="alert" className="flex flex-col items-start gap-2">
              <p className="text-sm text-red-700">{error}</p>
              {serverMode && (file || failedReadId) ? (
                <button type="button" className={secondaryButtonClass} onClick={() => void sendFile()} disabled={busy}>
                  {failedReadId ? "Retry" : "Retry upload"}
                </button>
              ) : null}
            </div>
          ) : null}

          {file ? (
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-[10px] font-semibold tracking-wide text-slate-600">
                  {file && isMarkdownFileName(file.name) ? "MD" : "PDF"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900">
                    {file.name}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {formatFileSize(file.size)}
                  </span>
                </span>
                <button
                  type="button"
                  className={ghostIconButtonClass}
                  aria-label={`Remove ${file.name}`}
                  onClick={() => {
                    setFile(null);
                    setPhase("idle");
                    setFailedReadId(null);
                  }}
                >
                  <CloseGlyph className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-3 flex items-center gap-2 text-sm text-slate-600" aria-live="polite">
                {serverMode ? (
                  busy ? (
                    <>
                      <RollingMark />
                      Uploading
                    </>
                  ) : (
                    "Ready to upload."
                  )
                ) : phase === "checking" ? (
                  <>
                    <RollingMark />
                    Checking the file
                  </>
                ) : (
                  "Ready to open."
                )}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
          <button type="button" className={`${secondaryButtonClass} w-full sm:w-auto`} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className={`${primaryButtonClass} w-full sm:w-auto`}
            disabled={serverMode ? !file || busy || !signedIn : !ready || !file}
            aria-busy={busy || phase === "checking"}
            onClick={() => {
              if (serverMode) {
                void sendFile();
                return;
              }
              if (file && ready) onOpenDocument(file);
            }}
          >
            {busy ? <RollingMark /> : null}
            {serverMode ? (busy ? "Uploading" : "Upload") : "Open document"}
          </button>
        </div>
      </div>
    </div>
    </OverlayPortal>
  );
}


"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  ghostIconButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/button-styles";
import { CheckGlyph, CloseGlyph, UploadGlyph } from "@/components/icons";
import { formatFileSize, validatePdfFile } from "@/lib/upload-validation";

type UploadPhase = "idle" | "uploading" | "reading" | "ready";

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
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [readPercent, setReadPercent] = useState(0);
  const [busy, setBusy] = useState(false);
  const serverMode = uploadMode === "server";

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (open) return;
    setFile(null);
    setError(null);
    setDragOver(false);
    setPhase("idle");
    setUploadPercent(0);
    setReadPercent(0);
    setBusy(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.focus();

    function focusable() {
      if (!dialog) return [];
      return Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
        ),
      );
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (serverMode || !file || phase === "idle" || phase === "ready") return;
    const timer = window.setInterval(() => {
      if (phase === "uploading") {
        setUploadPercent((current) => Math.min(100, current + 20));
      } else {
        setReadPercent((current) => Math.min(100, current + 15));
      }
    }, 160);
    return () => window.clearInterval(timer);
  }, [file, phase, serverMode]);

  useEffect(() => {
    if (phase === "uploading" && uploadPercent >= 100) {
      setPhase("reading");
    }
    if (phase === "reading" && readPercent >= 100) {
      setPhase("ready");
    }
  }, [phase, uploadPercent, readPercent]);

  function takeFile(next: File | undefined) {
    if (!next) return;
    const result = validatePdfFile(next);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    setFile(next);
    setUploadPercent(0);
    setReadPercent(0);
    setPhase(serverMode ? "idle" : "uploading");
    if (inputRef.current) inputRef.current.value = "";
  }

  if (!open) return null;

  const ready = phase === "ready";
  const statusLabel =
    phase === "uploading"
      ? "Uploading"
      : phase === "reading"
        ? "Reading the PDF"
        : phase === "ready"
          ? "Ready to open"
          : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-3 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="max-h-[calc(100vh-1.5rem)] w-full max-w-lg overflow-auto rounded-2xl bg-white shadow-2xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-slate-950">
            Upload a PDF
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

        <div className="space-y-4 px-5 py-5">
          {serverMode && !signedIn ? (
            <div className="rounded-xl border border-slate-200 bg-[#f8f9fb] px-4 py-8 text-center">
              <p className="text-sm text-slate-700">Sign in to upload a PDF.</p>
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
              Drop a PDF here or <span className="font-medium text-[#4338ca] underline">browse</span>
            </span>
            <span id="upload-hint" className="mt-1 text-xs text-slate-500">
              {serverMode ? "PDF only, up to 10 MB. 5 documents per account." : "Up to 10 MB"}
            </span>
            <input
              ref={inputRef}
              id="pdf-file"
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              aria-label="Choose a PDF"
              aria-describedby={error ? "upload-error" : "upload-hint"}
              aria-invalid={error ? true : undefined}
              onChange={(event) => takeFile(event.target.files?.[0])}
            />
          </label>
          )}

          {error ? (
            <p id="upload-error" role="alert" className="text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {file ? (
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-[10px] font-semibold tracking-wide text-slate-600">
                  PDF
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
                    setUploadPercent(0);
                    setReadPercent(0);
                  }}
                >
                  <CloseGlyph className="h-4 w-4" />
                </button>
              </div>

              {serverMode ? (
                <p className="mt-3 text-sm text-slate-600" aria-live="polite">
                  {busy ? "Uploading and reading the PDF." : "Ready to upload."}
                </p>
              ) : (
              <div className="mt-3 space-y-2" aria-live="polite">
                <ProgressRow
                  done={uploadPercent >= 100}
                  label={uploadPercent >= 100 ? "Uploading complete" : "Uploading"}
                  percent={uploadPercent}
                />
                {phase !== "uploading" ? (
                  <ProgressRow
                    done={phase === "ready"}
                    label="Reading the PDF"
                    percent={readPercent}
                  />
                ) : null}
                <p className="sr-only">{statusLabel}</p>
              </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button type="button" className={secondaryButtonClass} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={primaryButtonClass}
            disabled={serverMode ? !file || busy || !signedIn : !ready || !file}
            onClick={() => {
              if (serverMode) {
                if (!file || !onUpload || busy) return;
                setBusy(true);
                setError(null);
                void onUpload(file)
                  .catch((uploadError: unknown) => {
                    setError(
                      uploadError instanceof Error
                        ? uploadError.message
                        : "Upload failed. Try again later.",
                    );
                  })
                  .finally(() => setBusy(false));
                return;
              }
              if (file && ready) onOpenDocument(file);
            }}
          >
            {serverMode ? (busy ? "Uploading" : "Upload") : "Open document"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProgressRow({
  done,
  label,
  percent,
}: {
  done: boolean;
  label: string;
  percent: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="inline-flex items-center gap-2 text-slate-700">
          {done ? (
            <CheckGlyph className="h-4 w-4 text-emerald-600" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-[#4f46e5]" aria-hidden="true" />
          )}
          {label}
        </span>
        <span className="tabular-nums text-slate-500" aria-hidden="true">
          {percent}%
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#4f46e5]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

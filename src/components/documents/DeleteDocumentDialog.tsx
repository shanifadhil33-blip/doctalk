"use client";

import { useEffect, useId, useRef } from "react";
import { primaryButtonClass, secondaryButtonClass } from "@/components/button-styles";

export function DeleteDocumentDialog({
  open,
  fileName,
  pending = false,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  fileName?: string;
  pending?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

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
        dialog.querySelectorAll<HTMLElement>("button:not([disabled])"),
      );
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (pending) return;
        event.preventDefault();
        onCancelRef.current();
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
  }, [open, pending]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-3 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (pending) return;
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl outline-none"
      >
        <div className="px-5 py-5">
          <h2 id={titleId} className="text-lg font-semibold text-slate-950">
            Delete this document?
          </h2>
          <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-slate-600">
            This document will be deleted.
          </p>
          {fileName ? (
            <p className="mt-3 truncate text-sm font-medium text-slate-950">{fileName}</p>
          ) : null}
          {error ? (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className={primaryButtonClass}
            onClick={onConfirm}
            disabled={pending}
            aria-busy={pending}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

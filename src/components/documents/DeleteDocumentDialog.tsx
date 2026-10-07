"use client";

import { useId, useRef } from "react";
import { dangerButtonClass, dialogBackdropClass, dialogPanelClass, secondaryButtonClass } from "@/components/button-styles";
import { OverlayPortal } from "@/components/OverlayPortal";
import { RollingMark } from "@/components/RollingMark";
import { useDialog } from "@/components/useDialog";

export function DeleteDocumentDialog({
  open,
  documentName,
  fileName,
  pending = false,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  documentName?: string;
  fileName?: string;
  pending?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useDialog(open, onCancel, {
    locked: pending,
    initialFocusRef: cancelRef,
  });
  const name = (documentName?.trim() || fileName?.trim() || "this document").replaceAll('"', "'");

  if (!open) return null;

  return (
    <OverlayPortal>
    <div
      className={dialogBackdropClass}
      onPointerDown={(event) => {
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
        className={dialogPanelClass}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          const target = event.target;
          if (!(target instanceof HTMLButtonElement)) {
            event.preventDefault();
          }
        }}
      >
        <div className="min-h-0 overflow-y-auto px-5 py-5">
          <h2 id={titleId} className="break-words text-lg font-semibold text-slate-950">
            {`Delete "${name}"?`}
          </h2>
          <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-slate-600">
            This can&apos;t be undone.
          </p>
          {error ? (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            className={`${secondaryButtonClass} w-full sm:w-auto`}
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`${dangerButtonClass} w-full sm:w-auto`}
            onClick={onConfirm}
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? <RollingMark /> : null}
            {pending ? "Deleting" : "Delete document"}
          </button>
        </div>
      </div>
    </div>
    </OverlayPortal>
  );
}

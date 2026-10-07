"use client";

import { useId, useRef } from "react";
import { dialogBackdropClass, dialogPanelClass, secondaryButtonClass } from "@/components/button-styles";
import { useDialog } from "@/components/useDialog";

export type DocumentInfo = {
  name: string;
  fileName: string;
  type: string;
  added: string;
  status: string;
  pages?: number;
};

export function DocumentInfoDialog({
  open,
  info,
  onClose,
}: {
  open: boolean;
  info: DocumentInfo | null;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useDialog(open, onClose, { initialFocusRef: closeRef });

  if (!open || !info) return null;

  const rows: { label: string; value: string }[] = [
    { label: "Name", value: info.name },
    { label: "File", value: info.fileName },
    { label: "Type", value: info.type },
    { label: "Added", value: info.added },
    { label: "Status", value: info.status },
  ];
  if (info.pages && info.pages > 0) {
    rows.push({ label: "Pages", value: String(info.pages) });
  }

  return (
    <div
      className={dialogBackdropClass}
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
        className={dialogPanelClass}
      >
        <div className="min-h-0 overflow-y-auto px-5 py-5">
          <h2 id={titleId} className="text-lg font-semibold text-slate-950">
            Document info
          </h2>
          <dl className="mt-4 space-y-3">
            {rows.map((row) => (
              <div key={row.label}>
                <dt className="text-xs font-medium text-slate-500">{row.label}</dt>
                <dd className="mt-0.5 break-words text-sm text-slate-950">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex shrink-0 justify-end border-t border-slate-200 px-5 py-4">
          <button ref={closeRef} type="button" className={`${secondaryButtonClass} w-full sm:w-auto`} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function addedLabel(addedOn: string | undefined, meta: string): string {
  if (!addedOn) return meta;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(addedOn);
  if (!match) return meta;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

"use client";

import { useEffect, useId, useRef } from "react";
import { secondaryButtonClass } from "@/components/button-styles";

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
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open]);

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
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl outline-none"
      >
        <div className="px-5 py-5">
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
        <div className="flex justify-end border-t border-slate-200 px-5 py-4">
          <button type="button" className={secondaryButtonClass} onClick={onClose}>
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

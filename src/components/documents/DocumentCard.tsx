import Link from "next/link";

export type DocumentCardModel = {
  id: string;
  title: string;
  counterparty: string;
  kindLabel: string;
  meta: string;
  status: string;
  preview: "invoice" | "statement" | "contract" | "file";
  fileName: string;
};

export function DocumentCard({
  item,
  layout,
}: {
  item: DocumentCardModel;
  layout: "grid" | "list";
}) {
  if (layout === "list") {
    return (
      <Link
        href={`/documents/${item.id}`}
        aria-label={`Open ${item.title}`}
        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <span>
          <span className="text-xs font-medium text-slate-500">{item.kindLabel}</span>
          <span className="mt-1 block text-base font-semibold text-slate-950">
            {item.title}
          </span>
          <span className="mt-0.5 block text-sm text-slate-600">{item.counterparty}</span>
          <span className="mt-1 block text-sm text-slate-500">{item.meta}</span>
        </span>
        <span className="text-sm font-medium text-[#4338ca]">Open document</span>
      </Link>
    );
  }

  return (
    <Link
      href={`/documents/${item.id}`}
      aria-label={`Open ${item.title}`}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:border-slate-300 hover:shadow-sm"
    >
      <Thumbnail preview={item.preview} />
      <span className="flex flex-1 flex-col p-4">
        <span className="w-fit rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {item.kindLabel}
        </span>
        <span className="mt-3 block text-lg font-semibold leading-snug text-slate-950">
          {item.title}
        </span>
        <span className="mt-1 block text-sm text-slate-600">{item.counterparty}</span>
        <span className="mt-2 block text-sm text-slate-500">{item.meta}</span>
        <span className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-sm">
          <span className="text-slate-500">{item.status}</span>
          <span className="font-medium text-[#4338ca]">Open document</span>
        </span>
      </span>
    </Link>
  );
}

function Thumbnail({ preview }: { preview: DocumentCardModel["preview"] }) {
  return (
    <span
      aria-hidden="true"
      className="block h-[210px] overflow-hidden border-b border-slate-200 bg-white px-4 py-4"
    >
      {preview === "invoice" ? <InvoicePreview /> : null}
      {preview === "statement" ? <StatementPreview /> : null}
      {preview === "contract" ? <ContractPreview /> : null}
      {preview === "file" ? <FilePreview /> : null}
    </span>
  );
}

function InvoicePreview() {
  return (
    <span className="block text-[10px] leading-tight text-slate-600">
      <span className="flex justify-between font-semibold uppercase tracking-wide text-slate-800">
        <span>Invoice</span>
        <span>Northwind Supplies</span>
      </span>
      <span className="mt-1 flex justify-between text-slate-400">
        <span>#INV-20418</span>
        <span>Sep 12, 2024</span>
      </span>
      <span className="mt-3 grid grid-cols-[1fr_auto_auto] gap-x-3 border-b border-slate-200 pb-1 font-medium text-slate-400">
        <span>Item</span>
        <span>Qty</span>
        <span>Amount</span>
      </span>
      <PreviewRow left="Rack Servers 2U" mid="4" right="$8,400.00" />
      <PreviewRow left="SFP+ Transceiver 10G" mid="16" right="$1,120.00" />
      <PreviewRow left="Cat6a Patch Cables" mid="40" right="$366.00" />
      <span className="mt-3 flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900">
        <span>Total due</span>
        <span>$9,886.00</span>
      </span>
    </span>
  );
}

function StatementPreview() {
  return (
    <span className="block text-[10px] leading-tight text-slate-600">
      <span className="flex justify-between font-semibold uppercase tracking-wide text-slate-800">
        <span>St. Mary&apos;s Medical Center</span>
        <span>Acct #9942-A</span>
      </span>
      <span className="mt-1 flex justify-between text-slate-400">
        <span>Patient billing</span>
        <span>Sep 10, 2024</span>
      </span>
      <span className="mt-3 flex justify-between border-b border-slate-200 pb-1 font-medium text-slate-400">
        <span>Department service</span>
        <span>Fee</span>
      </span>
      <PreviewPair left="Emergency Department Level 4" right="$1,420.00" />
      <PreviewPair left="Computed Tomography (CT) Scan" right="$840.00" />
      <PreviewPair left="Pharmacy / Dispensed Meds" right="$165.40" />
      <PreviewPair left="Diagnostic Laboratory Panel" right="$290.00" />
      <span className="mt-3 flex justify-between border-t border-slate-200 pt-2">
        <span>Ins. covered: $2,240.00</span>
        <span className="font-semibold text-slate-900">Patient owes: $475.40</span>
      </span>
    </span>
  );
}

function ContractPreview() {
  return (
    <span className="block text-[10px] leading-relaxed text-slate-600">
      <span className="flex justify-between font-semibold uppercase tracking-wide text-slate-800">
        <span>Master Services Agreement</span>
        <span className="text-right font-medium normal-case tracking-normal text-slate-400">
          Dated Aug 26, 2024
        </span>
      </span>
      <span className="mt-3 block font-semibold text-slate-800">Recitals</span>
      <span className="mt-1 block">
        Acme Corporation and Brightline Solutions want terms for deliverables, payment, and termination.
      </span>
      <span className="mt-3 block font-semibold text-slate-800">1. Provision of services</span>
      <span className="mt-1 block">
        The provider performs the services described in each statement of work signed by both parties.
      </span>
      <span className="mt-4 flex justify-between text-[9px] uppercase tracking-wide text-slate-400">
        <span>Execution copy</span>
        <span>Page 1 of 11</span>
      </span>
    </span>
  );
}

function FilePreview() {
  return (
    <span className="grid h-full place-items-center text-sm font-medium text-slate-400">
      PDF
    </span>
  );
}

function PreviewRow({
  left,
  mid,
  right,
}: {
  left: string;
  mid: string;
  right: string;
}) {
  return (
    <span className="mt-1.5 grid grid-cols-[1fr_auto_auto] gap-x-3">
      <span className="truncate">{left}</span>
      <span>{mid}</span>
      <span>{right}</span>
    </span>
  );
}

function PreviewPair({ left, right }: { left: string; right: string }) {
  return (
    <span className="mt-1.5 flex justify-between gap-3">
      <span className="truncate">{left}</span>
      <span className="shrink-0">{right}</span>
    </span>
  );
}

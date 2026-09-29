"use client";

import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  ChevronLeftGlyph,
  ChevronRightGlyph,
  MinusGlyph,
  PlusGlyph,
} from "@/components/icons";
import { iconButtonClass, toolbarButtonClass } from "@/components/button-styles";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export function RealPdfViewer({
  fileUrl,
  fileName,
  page,
  onPageChange,
  onPageCount,
}: {
  fileUrl: string;
  fileName: string;
  page: number;
  onPageChange: (page: number) => void;
  onPageCount?: (count: number) => void;
}) {
  const [pageCount, setPageCount] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const safePage = pageCount > 0 ? Math.min(Math.max(page, 1), pageCount) : Math.max(page, 1);

  useEffect(() => {
    document.getElementById("pdf-scroll")?.scrollTo({ top: 0 });
  }, [safePage]);

  return (
    <div className="flex h-full min-h-[70vh] w-full min-w-0 flex-1 flex-col lg:min-h-0">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
        <button
          type="button"
          className={iconButtonClass}
          aria-label="Previous page"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          <ChevronLeftGlyph />
        </button>
        <p className="min-w-16 text-center text-sm tabular-nums text-slate-700" aria-live="polite">
          <span className="sr-only">Page </span>
          {pageCount > 0 ? `${safePage} / ${pageCount}` : safePage}
        </p>
        <button
          type="button"
          className={iconButtonClass}
          aria-label="Next page"
          disabled={pageCount > 0 && safePage >= pageCount}
          onClick={() => onPageChange(safePage + 1)}
        >
          <ChevronRightGlyph />
        </button>
        <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" aria-hidden="true" />
        <button
          type="button"
          className={iconButtonClass}
          aria-label="Zoom out"
          onClick={() => setZoom((value) => Math.max(80, value - 10))}
        >
          <MinusGlyph />
        </button>
        <span className="w-12 text-center text-sm tabular-nums text-slate-700">{zoom}%</span>
        <button
          type="button"
          className={iconButtonClass}
          aria-label="Zoom in"
          onClick={() => setZoom((value) => Math.min(150, value + 10))}
        >
          <PlusGlyph />
        </button>
        <button
          type="button"
          className={toolbarButtonClass}
          onClick={() => setZoom(100)}
        >
          Fit width
        </button>
      </div>
      <div id="pdf-scroll" className="min-h-0 flex-1 overflow-auto bg-[#eef0f3] px-3 py-6 sm:px-6">
        {error ? (
          <p className="mx-auto max-w-md rounded-xl bg-white p-6 text-sm text-slate-600" role="alert">
            {error}
          </p>
        ) : (
          <Document
            file={fileUrl}
            loading={<p className="text-sm text-slate-600">Loading PDF...</p>}
            onLoadSuccess={({ numPages }) => {
              setPageCount(numPages);
              onPageCount?.(numPages);
            }}
            onLoadError={() => setError("This PDF could not be displayed.")}
          >
            <article aria-label={`Page ${safePage}`} className="mx-auto w-fit bg-white shadow-sm ring-1 ring-slate-200">
              <Page
                pageNumber={safePage}
                width={Math.round(720 * (zoom / 100))}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={<p className="p-6 text-sm text-slate-600">Loading page...</p>}
              />
            </article>
          </Document>
        )}
        <p className="sr-only">{fileName}</p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { MinusGlyph, PlusGlyph } from "@/components/icons";
import { iconButtonClass, toolbarButtonClass } from "@/components/button-styles";
import { fittedPageWidth } from "@/components/workspace/pdf-fit";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export function RealPdfViewer({
  fileUrl,
  fileName,
  page,
  onPageCount,
}: {
  fileUrl: string;
  fileName: string;
  page: number;
  onPageCount?: (count: number) => void;
}) {
  const [pageCount, setPageCount] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [paneWidth, setPaneWidth] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const scrolledPage = useRef<number | null>(null);
  const pageWidth = fittedPageWidth(paneWidth, zoom);
  const safePage = pageCount > 0 ? Math.min(Math.max(page, 1), pageCount) : Math.max(page, 1);

  useLayoutEffect(() => {
    const node = paneRef.current;
    if (!node) return;
    const measure = () => {
      const style = getComputedStyle(node);
      const pad = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const next = Math.floor(node.clientWidth - (Number.isFinite(pad) ? pad : 0) - 2);
      setPaneWidth(next > 0 ? next : 0);
    };
    measure();
    if (typeof ResizeObserver !== "function") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = document.getElementById(`pdf-page-${safePage}`);
    if (!node || scrolledPage.current === safePage) return;
    const openingOnFirstPage = scrolledPage.current === null && safePage <= 1;
    scrolledPage.current = safePage;
    if (openingOnFirstPage) return;
    const pane = paneRef.current;
    if (!pane) return;
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const top = node.getBoundingClientRect().top - pane.getBoundingClientRect().top + pane.scrollTop;
    pane.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  }, [safePage, pageCount, pageWidth]);

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-hidden">
      <div className="flex w-full min-w-0 max-w-full flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
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
        <button type="button" className={toolbarButtonClass} onClick={() => setZoom(100)}>
          Fit width
        </button>
      </div>
      <div
        id="pdf-scroll"
        ref={paneRef}
        className={[
          "min-h-0 w-full min-w-0 max-w-full flex-1 contain-paint overflow-y-auto overscroll-contain bg-[#eef0f3] px-3 py-3 sm:px-6 sm:py-4",
          zoom > 100 ? "overflow-x-auto" : "overflow-x-hidden",
        ].join(" ")}
      >
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
            {pageCount > 0 && pageWidth > 0 ? (
              <div
                className={
                  zoom > 100
                    ? "mx-auto flex w-max flex-col gap-3"
                    : "mx-auto flex w-full max-w-full flex-col gap-3"
                }
              >
                {Array.from({ length: pageCount }, (_, index) => {
                  const pageNumber = index + 1;
                  return (
                    <article
                      key={pageNumber}
                      id={`pdf-page-${pageNumber}`}
                      aria-label={`Page ${pageNumber}`}
                      className="bg-white shadow-sm ring-1 ring-slate-200 outline-none focus:outline-none focus-visible:outline-none"
                    >
                      <Page
                        pageNumber={pageNumber}
                        width={pageWidth}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        loading={<p className="p-6 text-sm text-slate-600">Loading page...</p>}
                        className="outline-none focus:outline-none focus-visible:outline-none [&_canvas]:outline-none [&_canvas]:focus:outline-none [&_canvas]:focus-visible:outline-none"
                      />
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-600">Loading page...</p>
            )}
          </Document>
        )}
        <p className="sr-only">{fileName}</p>
      </div>
    </div>
  );
}

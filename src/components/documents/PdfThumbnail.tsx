"use client";

import { useState, type ReactNode } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const pdfOptions = { withCredentials: true as const };

export function PdfThumbnail({
  fileSrc,
  width,
  fallback,
  onPageCount,
}: {
  fileSrc: string;
  width: number;
  fallback: ReactNode;
  onPageCount?: (pageCount: number) => void;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) return fallback;

  return (
    <Document
      file={fileSrc}
      options={pdfOptions}
      loading={<PreviewSkeleton />}
      error={fallback}
      onLoadError={() => setFailed(true)}
      onLoadSuccess={(loaded) => onPageCount?.(loaded.numPages)}
      className="pointer-events-none"
    >
      <Page
        pageNumber={1}
        width={Math.max(width, 1)}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        loading={<PreviewSkeleton />}
        onRenderError={() => setFailed(true)}
        className="pointer-events-none"
      />
    </Document>
  );
}

function PreviewSkeleton() {
  return <span className="block h-full min-h-24 w-full animate-pulse bg-slate-100" />;
}

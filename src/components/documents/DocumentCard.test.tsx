// @vitest-environment jsdom
import "@/test/setup";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DocumentCard } from "@/components/documents/DocumentCard";

vi.mock("next/link", () => {
  return {
    default: ({
      href,
      children,
      ...props
    }: { href: string; children: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  };
});

vi.mock("next/dynamic", () => {
  return {
    default: () =>
      function PdfThumbnailMock({
        fileSrc,
        fallback,
      }: {
        fileSrc: string;
        fallback: ReactNode;
      }) {
        return (
          <span data-testid="pdf-thumbnail" data-src={fileSrc}>
            {fallback}
          </span>
        );
      },
  };
});

const invoice = {
  id: "sample-invoice",
  title: "Sample_Invoice",
  counterparty: "Sample",
  kindLabel: "PDF",
  meta: "Added May 2",
  status: "Sample",
  preview: "file" as const,
  fileName: "Sample_Invoice.pdf",
  pageCount: 0,
};

describe("DocumentCard", () => {
  it("shows the invoice's own first-page text and its real PDF", () => {
    render(
      <DocumentCard
        item={invoice}
        layout="grid"
        fileSrc="/demo/sample-invoice.pdf"
      />,
    );

    expect(screen.getByText("SAMPLE INVOICE")).toBeInTheDocument();
    expect(screen.getByText("Invoice number: INV-1044")).toBeInTheDocument();
    expect(screen.getByText("4 pages · Added May 2")).toBeInTheDocument();
    expect(screen.getByTestId("pdf-thumbnail")).toHaveAttribute(
      "data-src",
      "/demo/sample-invoice.pdf",
    );
    expect(screen.queryByText("Rack Servers 2U")).not.toBeInTheDocument();
  });
});

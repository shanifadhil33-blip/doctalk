// @vitest-environment jsdom
import "@/test/setup";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    expect(screen.queryByText("Open document")).not.toBeInTheDocument();
  });

  it("opens info and delete from the card menu without opening the document", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const owned = {
      ...invoice,
      id: "owned-note",
      title: "Desk note",
      status: "Yours",
      kindLabel: "Markdown",
      fileName: "desk-note.md",
      addedOn: "2026-03-18",
      meta: "Added Mar 18",
    };

    render(
      <DocumentCard item={owned} layout="grid" menu onDelete={onDelete} />,
    );

    const link = screen.getByRole("link", { name: "Open Desk note" });
    const actions = screen.getByRole("button", { name: "Actions for Desk note" });
    expect(link.contains(actions)).toBe(false);
    expect(screen.queryByText("Open document")).not.toBeInTheDocument();

    await user.click(actions);
    expect(screen.getByRole("menuitem", { name: "Info" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/documents/owned-note");

    await user.click(screen.getByRole("menuitem", { name: "Info" }));
    const info = screen.getByRole("dialog", { name: "Document info" });
    expect(info).toHaveTextContent("Desk note");
    expect(info).toHaveTextContent("Markdown");
    expect(info).toHaveTextContent("Mar 18, 2026");
    expect(info).toHaveTextContent("desk-note.md");
    await user.click(within(info).getByRole("button", { name: "Close" }));

    await user.click(actions);
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    const confirmDialog = screen.getByRole("dialog", { name: "Delete this document?" });
    expect(confirmDialog).toHaveTextContent("This document will be deleted.");
    expect(confirm).not.toHaveBeenCalled();
    await user.click(within(confirmDialog).getByRole("button", { name: "Cancel" }));
    expect(onDelete).not.toHaveBeenCalled();

    await user.click(actions);
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Delete this document?" })).getByRole("button", {
        name: "Delete",
      }),
    );
    expect(onDelete).toHaveBeenCalledWith("owned-note");
    expect(confirm).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  it("hides delete for a sample and still offers info", async () => {
    const user = userEvent.setup();
    render(<DocumentCard item={invoice} layout="list" menu />);
    await user.click(screen.getByRole("button", { name: "Actions for Sample_Invoice" }));
    expect(screen.getByRole("menuitem", { name: "Info" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument();
    expect(screen.queryByText("Open document")).not.toBeInTheDocument();
  });
});

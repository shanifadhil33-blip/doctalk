// @vitest-environment jsdom
import "@/test/setup";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SignedInHome } from "@/components/home/SignedInHome";
import type { ListedDocument } from "@/lib/document-types";
import type { AskedQuestion } from "@/lib/questions/history";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: { href: string; children: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next/dynamic", () => ({
  default: () =>
    function PdfThumbnailMock() {
      return <span data-testid="pdf-thumbnail" />;
    },
}));

vi.mock("@/lib/documents/client-upload", () => ({
  uploadDocumentFromBrowser: vi.fn(),
}));

const owned: ListedDocument = {
  id: "owned-1",
  title: "Warehouse lease",
  counterparty: "Your document",
  kindLabel: "PDF",
  meta: "Added Sep 2",
  status: "Yours",
  preview: "file",
  fileName: "Warehouse-lease.pdf",
  addedOn: "2026-09-02",
  pageCount: 4,
};

const sample: ListedDocument = {
  id: "sample-1",
  title: "Master Services Agreement",
  counterparty: "Sample",
  kindLabel: "PDF",
  meta: "Added Jan 1",
  status: "Sample",
  preview: "contract",
  fileName: "Master-Services-Agreement.pdf",
  addedOn: "2026-01-01",
  pageCount: 11,
};

const question: AskedQuestion = {
  id: "q-1",
  documentId: "owned-1",
  documentTitle: "Warehouse lease",
  question: "What is the notice period?",
  answer: "Either party can terminate with 60 days written notice.",
  askedOn: "2026-09-30",
  askedLabel: "Sep 30, 2026",
};

function renderHome() {
  return render(
    <SignedInHome
      source="library"
      owned={[owned, sample]}
      questions={[question]}
      headerAccount={<a href="/settings">Settings</a>}
    />,
  );
}

describe("SignedInHome", () => {
  it("shows the account home instead of the marketing pitch", () => {
    renderHome();

    expect(screen.getByRole("heading", { name: "Your documents" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Upload PDF or Markdown" })).not.toBeInTheDocument();
    const uploadBox = screen.getByText("Upload a PDF or Markdown file").closest("label");
    expect(uploadBox).not.toBeNull();
    expect(uploadBox?.className).toContain("focus-within:outline");
    expect(screen.getByText("Drop a PDF or Markdown file here, or choose a file.")).toBeInTheDocument();
    expect(screen.getByText("PDF or Markdown, up to 10 MB. 5 documents per account.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Warehouse lease" })).toHaveAttribute(
      "href",
      "/documents/owned-1",
    );
    const actions = screen.getByRole("button", { name: "Actions for Warehouse lease" });
    expect(screen.getByRole("link", { name: "Open Warehouse lease" }).contains(actions)).toBe(false);
    expect(screen.getByRole("heading", { name: "Questions" })).toBeInTheDocument();
    expect(screen.getByText("What is the notice period?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /What is the notice period/ })).toHaveAttribute(
      "href",
      "/documents/owned-1",
    );
    expect(screen.queryByRole("heading", { name: "Sample documents" })).not.toBeInTheDocument();
    expect(screen.queryByText("Master Services Agreement")).not.toBeInTheDocument();
    expect(screen.queryByText("Sample")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Try the public demo" })).toHaveAttribute(
      "href",
      "/documents?demo=1",
    );
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/settings");
    expect(screen.queryByRole("link", { name: "Try the demo" })).not.toBeInTheDocument();
    expect(
      screen.queryByText(/DocTalk answers questions about your documents/),
    ).not.toBeInTheDocument();

    const shell = document.getElementById("main")?.parentElement;
    expect(shell).toHaveClass("overflow-x-hidden", "max-w-full");
  });

  it("rejects a file that is not a PDF", () => {
    renderHome();

    fireEvent.change(screen.getByLabelText("Choose a PDF or Markdown file"), {
      target: {
        files: [new File(["hello"], "notes.txt", { type: "text/plain" })],
      },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Only PDF and Markdown files can be uploaded.",
    );
  });

  it("accepts a markdown file and shows a moving upload mark", async () => {
    const { uploadDocumentFromBrowser } = await import("@/lib/documents/client-upload");
    let finish: (value: { id: string }) => void = () => {};
    vi.mocked(uploadDocumentFromBrowser).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );

    renderHome();
    fireEvent.change(screen.getByLabelText("Choose a PDF or Markdown file"), {
      target: {
        files: [new File(["# Desk hours\nOpen at 8:30."], "desk-note.md", { type: "text/markdown" })],
      },
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Uploading");
    expect(status.querySelector("svg")).toHaveClass("animate-spin");
    expect(screen.queryByText("desk-note.md")).not.toBeInTheDocument();

    finish({ id: "uploaded-note" });
    await screen.findByText("Drop a PDF or Markdown file here, or choose a file.");
  });

  it("says when there are no documents or questions yet", () => {
    render(
      <SignedInHome
        source="library"
        owned={[sample]}
        questions={[]}
        headerAccount={<span>Ada</span>}
      />,
    );

    expect(screen.getByRole("heading", { name: "No documents yet" })).toBeInTheDocument();
    expect(screen.getByText("Use the upload box above to add a PDF or Markdown file.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Upload your first document" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Upload PDF or Markdown" })).not.toBeInTheDocument();
    expect(screen.queryByText("Master Services Agreement")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Questions you ask will show up here\. Open a document and ask a question\./),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sample documents" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Try the demo" })).not.toBeInTheDocument();
  });
});

// @vitest-environment jsdom
import "@/test/setup";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DocumentsDashboard } from "@/components/documents/DocumentsDashboard";
import type { ListedDocument } from "@/lib/document-types";
import { withSampleSortFacts } from "@/lib/documents/sample-sort";

const navigation = vi.hoisted(() => ({
  replace: vi.fn(() => new Promise<void>(() => undefined)),
  push: vi.fn(),
  refresh: vi.fn(),
}));

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

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

vi.mock("next/dynamic", () => ({
  default: () =>
    function PreviewStub() {
      return <span data-testid="preview" />;
    },
}));

const owned: ListedDocument = {
  id: "owned-note",
  title: "Desk note",
  counterparty: "Your document",
  kindLabel: "Markdown",
  meta: "Added Mar 18",
  status: "Yours",
  preview: "file",
  fileName: "desk-note.md",
  addedOn: "2026-03-18",
  pageCount: 0,
};

afterEach(() => {
  vi.unstubAllGlobals();
  navigation.replace.mockClear();
});

function publicSample(fileName: string, title: string): ListedDocument {
  return withSampleSortFacts({
    id: fileName,
    title,
    counterparty: "Sample",
    kindLabel: fileName.endsWith(".md") ? "Markdown" : "PDF",
    meta: "Added Sep 29",
    status: "Sample",
    preview: "file",
    fileName,
    addedOn: "2026-09-29",
    pageCount: 0,
  });
}

const publicSamples = [
  publicSample("Sample_Data_Policy.pdf", "Sample_Data_Policy"),
  publicSample("Sample_Invoice.pdf", "Sample_Invoice"),
  publicSample("Sample_Services_Agreement.pdf", "Sample_Services_Agreement"),
];

function openOrder(): string[] {
  return screen.getAllByRole("link", { name: /^Open / }).map((link) => link.getAttribute("aria-label") ?? "");
}

describe("DocumentsDashboard", () => {
  it("gives every signed-in card a menu and does not say Open document", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
    const user = userEvent.setup();
    render(
      <DocumentsDashboard
        documents={[owned]}
        source="library"
        signedIn
        headerAccount={<span>Account</span>}
      />,
    );

    expect(screen.queryByText("Open document")).not.toBeInTheDocument();
    const actions = screen.getByRole("button", { name: "Actions for Desk note" });
    const link = screen.getByRole("link", { name: "Open Desk note" });
    expect(link.contains(actions)).toBe(false);

    await user.click(actions);
    expect(screen.getByRole("menuitem", { name: "Info" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/documents/owned-note");
  });

  it("leaves the public demo cards without a menu", () => {
    render(
      <DocumentsDashboard
        documents={[{ ...owned, status: "Sample" }]}
        source="demo"
        signedIn={false}
        headerAccount={<span>Sign in</span>}
      />,
    );

    expect(screen.queryByText("Open document")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Actions for/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Desk note" })).toBeInTheDocument();
  });

  it("hides sample files from a signed-in library and offers an upload on an empty list", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
    const { rerender } = render(
      <DocumentsDashboard
        documents={[
          owned,
          {
            ...owned,
            id: "sample-services",
            title: "Sample_Services_Agreement",
            fileName: "Sample_Services_Agreement.pdf",
            status: "Sample",
          },
        ]}
        source="library"
        signedIn
        headerAccount={<span>Account</span>}
      />,
    );

    expect(screen.getByRole("link", { name: "Open Desk note" })).toBeInTheDocument();
    expect(screen.queryByText("Sample_Services_Agreement")).not.toBeInTheDocument();
    expect(screen.queryByText("You're viewing demo documents.")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Try the public demo" })).not.toBeInTheDocument();
    expect(screen.queryByText("Inspect contracts, billing statements, and medical invoices.")).not.toBeInTheDocument();
    expect(screen.getByText("PDF and Markdown files in your account.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Upload PDF or Markdown" })).not.toBeInTheDocument();

    rerender(
      <DocumentsDashboard
        documents={[]}
        source="library"
        signedIn
        headerAccount={<span>Account</span>}
      />,
    );

    expect(screen.getByRole("heading", { name: "No documents yet" })).toBeInTheDocument();
    expect(
      screen.getByText("Use the upload box on your documents page to add a PDF or Markdown file."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Upload your first document" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Upload PDF or Markdown" })).not.toBeInTheDocument();
  });

  it("updates the sort label and card order before navigation settles", async () => {
    const user = userEvent.setup();
    render(
      <DocumentsDashboard
        documents={publicSamples}
        source="demo"
        signedIn={false}
        headerAccount={<span>Sign in</span>}
        initialSort="name"
      />,
    );

    expect(screen.getByRole("button", { name: "Sort by Name" })).toBeInTheDocument();
    expect(openOrder()).toEqual([
      "Open Sample_Data_Policy",
      "Open Sample_Invoice",
      "Open Sample_Services_Agreement",
    ]);

    await user.click(screen.getByRole("button", { name: "Sort by Name" }));
    await user.click(screen.getByRole("option", { name: "Recently added" }));

    expect(screen.getByRole("button", { name: "Sort by Recently added" })).toBeInTheDocument();
    expect(openOrder()).toEqual([
      "Open Sample_Invoice",
      "Open Sample_Services_Agreement",
      "Open Sample_Data_Policy",
    ]);
    expect(navigation.replace).toHaveBeenCalledWith(expect.stringContaining("sort=recent"), {
      scroll: false,
    });
    expect(navigation.replace.mock.results[0]?.value).toBeInstanceOf(Promise);
  });

  it("does not open a card when the press moves like a scroll", () => {
    render(
      <DocumentsDashboard
        documents={publicSamples}
        source="demo"
        signedIn={false}
        headerAccount={<span>Sign in</span>}
      />,
    );

    const link = screen.getByRole("link", { name: "Open Sample_Invoice" });
    expect(link.className).not.toMatch(/scale|active:/);

    link.dispatchEvent(
      new MouseEvent("pointerdown", { bubbles: true, cancelable: true, clientX: 10, clientY: 10, button: 0 }),
    );
    const moved = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      clientX: 10,
      clientY: 40,
      button: 0,
    });
    link.dispatchEvent(moved);
    expect(moved.defaultPrevented).toBe(true);
  });
});

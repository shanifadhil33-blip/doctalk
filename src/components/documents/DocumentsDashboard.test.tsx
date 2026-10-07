// @vitest-environment jsdom
import "@/test/setup";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DocumentsDashboard } from "@/components/documents/DocumentsDashboard";
import type { ListedDocument } from "@/lib/document-types";

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
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
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
});

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
    expect(screen.getByRole("link", { name: "Try the public demo" })).toHaveAttribute(
      "href",
      "/documents?demo=1",
    );

    rerender(
      <DocumentsDashboard
        documents={[]}
        source="library"
        signedIn
        headerAccount={<span>Account</span>}
      />,
    );

    expect(screen.getByRole("heading", { name: "No documents yet" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload your first document" })).toBeInTheDocument();
  });
});

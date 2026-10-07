// @vitest-environment jsdom
import "@/test/setup";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LiveDocumentWorkspace } from "@/components/workspace/LiveDocumentWorkspace";

vi.mock("next/dynamic", () => ({
  default: () =>
    function PdfStub() {
      return <div data-testid="pdf-viewer" />;
    },
}));

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
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

HTMLElement.prototype.scrollTo = vi.fn();

describe("LiveDocumentWorkspace question column", () => {
  it("places the description and question field directly under the pdf", () => {
    render(
      <LiveDocumentWorkspace
        documentId="sample-data-policy"
        fileName="Sample_Data_Policy.pdf"
        pdfSrc="/demo/sample-data-policy.pdf"
        headerAccount={<a href="/sign-in">Sign in</a>}
        documentStatus="ready"
        canDelete={false}
      />,
    );

    const heading = screen.getByRole("heading", { name: "Ask this document" });
    const shell = document.getElementById("main")?.parentElement;
    expect(shell).toHaveClass(
      "min-h-dvh",
      "overflow-x-hidden",
      "[overflow-anchor:none]",
      "lg:h-dvh",
      "lg:overflow-hidden",
    );
    expect(shell?.className.split(/\s+/)).not.toContain("h-dvh");
    expect(shell?.className.split(/\s+/)).not.toContain("overflow-hidden");
    const aside = heading.closest("aside");
    const asideClass = aside?.className.split(/\s+/) ?? [];
    expect(asideClass).toContain("h-[85dvh]");
    expect(asideClass).toContain("max-h-[85dvh]");
    expect(asideClass).toContain("lg:min-h-0");
    expect(asideClass).toContain("shrink-0");

    const description = screen.getByText(
      "Ask a question about this document. Sources point at the page they came from.",
    );
    const input = screen.getByRole("textbox", { name: "Ask a question about this document" });
    expect(
      description.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    const descriptionRegion = description.parentElement;
    if (!descriptionRegion) throw new Error("Missing question copy");
    const regionClass = descriptionRegion.className.split(/\s+/);
    expect(regionClass).toContain("flex-1");
    expect(regionClass).toContain("overflow-y-auto");
    expect(regionClass).not.toContain("overscroll-y-contain");
    expect(regionClass).toContain("[overflow-anchor:none]");
    expect(regionClass).not.toContain("max-h-36");
    const main = document.getElementById("main");
    expect(main?.querySelector("aside")?.previousElementSibling).toHaveAttribute(
      "data-testid",
      "pdf-viewer",
    );
    expect(
      descriptionRegion.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const footer = screen.getByText("Built by Adhil Shanif");
    const gap = [...(shell?.querySelectorAll(".h-24") ?? [])].find((node) =>
      node.classList.contains("lg:hidden"),
    );
    expect(gap).toHaveClass("h-24", "shrink-0", "lg:hidden");
    expect(input.compareDocumentPosition(gap as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect((gap as Node).compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows a spinner and keeps Send disabled until the answer arrives", async () => {
    let finish: (response: Response) => void = () => {};
    const pending = new Promise<Response>((resolve) => {
      finish = resolve;
    });
    vi.stubGlobal("fetch", vi.fn(() => pending));
    const user = userEvent.setup();

    render(
      <LiveDocumentWorkspace
        documentId="sample-data-policy"
        fileName="Sample_Data_Policy.pdf"
        pdfSrc="/demo/sample-data-policy.pdf"
        headerAccount={<a href="/sign-in">Sign in</a>}
        documentStatus="ready"
        canDelete={false}
      />,
    );

    await user.type(
      screen.getByRole("textbox", { name: "Ask a question about this document" }),
      "Who owns an uploaded file?",
    );
    await user.click(screen.getByRole("button", { name: "Send" }));

    const sending = screen.getByRole("button", { name: "Send" });
    expect(sending).toBeDisabled();
    expect(sending).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("Sending")).not.toBeInTheDocument();
    const waiting = screen.getByRole("status", { name: "Waiting for an answer" });
    const question = screen.getByText("Who owns an uploaded file?");
    expect(
      question.compareDocumentPosition(waiting) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByRole("list", { name: "Conversation" }).contains(waiting)).toBe(true);
    expect(sending.closest("form")?.contains(waiting)).toBe(false);
    const spinner = waiting.querySelector("svg");
    expect(spinner).toHaveClass("animate-spin");
    expect(spinner).toHaveAttribute("aria-hidden", "true");

    finish(
      new Response(JSON.stringify({ answer: "The uploading account owns it.", citations: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Send" })).toHaveAttribute("aria-busy", "false");
    expect(screen.getAllByText("The uploading account owns it.")).toHaveLength(2);
  });

  it("sends on Enter and keeps Shift+Enter as a new line", async () => {
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>(() => {
          /* leave the request pending */
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(
      <LiveDocumentWorkspace
        documentId="sample-data-policy"
        fileName="Sample_Data_Policy.pdf"
        pdfSrc="/demo/sample-data-policy.pdf"
        headerAccount={<a href="/sign-in">Sign in</a>}
        documentStatus="ready"
        canDelete={false}
      />,
    );

    const field = screen.getByRole("textbox", { name: "Ask a question about this document" });
    await user.type(field, "Line one{Shift>}{Enter}{/Shift}line two");
    expect(field).toHaveValue("Line one\nline two");
    expect(fetchMock).not.toHaveBeenCalled();

    await user.type(field, "{Enter}");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status", { name: "Waiting for an answer" })).toBeInTheDocument();
    expect(screen.queryByText("Sending")).not.toBeInTheDocument();
  });

  it("clears the spinner when the request fails", async () => {
    let finish: (response: Response) => void = () => {};
    const pending = new Promise<Response>((resolve) => {
      finish = resolve;
    });
    vi.stubGlobal("fetch", vi.fn(() => pending));
    const user = userEvent.setup();

    render(
      <LiveDocumentWorkspace
        documentId="sample-data-policy"
        fileName="Sample_Data_Policy.pdf"
        pdfSrc="/demo/sample-data-policy.pdf"
        headerAccount={<a href="/sign-in">Sign in</a>}
        documentStatus="ready"
        canDelete={false}
      />,
    );

    await user.type(
      screen.getByRole("textbox", { name: "Ask a question about this document" }),
      "Who owns an uploaded file?",
    );
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(screen.getByRole("status", { name: "Waiting for an answer" })).toBeInTheDocument();

    finish(
      new Response(JSON.stringify({ error: "Could not answer that question. Try again later." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
    });
    expect(screen.queryByRole("status", { name: "Waiting for an answer" })).not.toBeInTheDocument();
    expect(screen.queryByText("Sending")).not.toBeInTheDocument();
    expect(screen.getAllByText("Could not answer that question. Try again later.")).toHaveLength(2);
  });

  it("asks to delete in the app instead of the browser confirm box", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>(() => {
          /* leave the request pending */
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LiveDocumentWorkspace
        documentId="owned-note"
        fileName="desk-note.pdf"
        pdfSrc="/api/documents/owned-note/file"
        headerAccount={<a href="/sign-in">Sign in</a>}
        documentStatus="ready"
        canDelete
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = screen.getByRole("dialog", { name: 'Delete "desk-note.pdf"?' });
    expect(dialog).toHaveTextContent("This can't be undone.");
    expect(dialog).toHaveTextContent("desk-note.pdf");
    expect(confirm).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(
      within(screen.getByRole("dialog", { name: 'Delete "desk-note.pdf"?' })).getByRole("button", {
        name: "Delete document",
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith("/api/documents/owned-note", { method: "DELETE" });
    expect(confirm).not.toHaveBeenCalled();
    confirm.mockRestore();
  });
});

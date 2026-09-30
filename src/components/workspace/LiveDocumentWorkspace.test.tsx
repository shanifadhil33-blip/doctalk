// @vitest-environment jsdom
import "@/test/setup";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
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
      "min-h-screen",
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
});

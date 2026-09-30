// @vitest-environment jsdom
import "@/test/setup";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
    const aside = heading.closest("aside");
    expect(aside?.className).not.toContain("min-h-[28rem]");
    expect(aside?.className).toContain("lg:min-h-0");

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
    expect(regionClass).toContain("lg:flex-1");
    expect(regionClass).not.toContain("flex-1");
    expect(
      descriptionRegion.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

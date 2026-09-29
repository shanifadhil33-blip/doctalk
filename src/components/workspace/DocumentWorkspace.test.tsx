// @vitest-environment jsdom
import "@/test/setup";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DocumentWorkspace } from "@/components/workspace/DocumentWorkspace";
import { getDemoDocument } from "@/lib/demo-documents";

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

describe("DocumentWorkspace citations", () => {
  it("jumps the viewer to the cited page", async () => {
    const user = userEvent.setup();
    const document = getDemoDocument("master-services-agreement");
    if (!document) throw new Error("Missing sample contract");

    render(
      <DocumentWorkspace
        document={document}
        documentId={document.id}
        headerAccount={<a href="/sign-in">Sign in</a>}
      />,
    );

    expect(screen.getByText("3 / 11")).toBeInTheDocument();
    expect(screen.getByText("11 pages")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Export" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show source on page 7" }));
    expect(screen.getByText("7 / 11")).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Page 7" })).toHaveTextContent(
      "Notices for termination for convenience",
    );
  });

  it("copies the answer and the passage shown for the selected source", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const document = getDemoDocument("master-services-agreement");
    if (!document) throw new Error("Missing sample contract");

    render(
      <DocumentWorkspace
        document={document}
        documentId={document.id}
        headerAccount={<a href="/sign-in">Sign in</a>}
      />,
    );

    const send = screen.getByRole("button", { name: "Send" });
    expect(send).toBeDisabled();
    expect(send.className).toContain("disabled:cursor-not-allowed");
    expect(send.className).toContain("disabled:hover:bg-[#e4e3f8]");

    await user.click(screen.getByRole("button", { name: "Copy answer" }));
    expect(writeText).toHaveBeenCalledWith(document.intro.answer);
    expect(screen.getByRole("button", { name: "Copied" })).toHaveTextContent("Copied");

    const passage = document.intro.citations.find((citation) => citation.page === 7);
    if (!passage) throw new Error("Missing page 7 citation");
    await user.click(screen.getByRole("button", { name: "Show source on page 7" }));
    await user.click(screen.getByRole("button", { name: "Copy passage" }));
    expect(writeText).toHaveBeenCalledWith(passage.quote);
  });
});

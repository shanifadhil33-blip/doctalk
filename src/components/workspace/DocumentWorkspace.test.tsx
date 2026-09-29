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
        signInHref="/sign-in"
      />,
    );

    expect(screen.getByText("3 / 11")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show source on page 7" }));
    expect(screen.getByText("7 / 11")).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "Page 7" })).toHaveTextContent(
      "Notices for termination for convenience",
    );
  });
});

// @vitest-environment jsdom
import "@/test/setup";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LandingPage } from "@/components/landing/LandingPage";

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

describe("LandingPage", () => {
  it("keeps the public demo pitch for a signed-out visitor", () => {
    render(
      <LandingPage
        demoHref="/documents"
        sourceHref="/documents/sample"
        headerAccount={<a href="/sign-in">Sign in</a>}
        heroAccount={<button type="button">Sign in with Google</button>}
      />,
    );

    expect(
      screen.getByText(/DocTalk answers questions about your documents/),
    ).toBeInTheDocument();
    const demoLinks = screen.getAllByRole("link", { name: "Try the demo" });
    expect(demoLinks).toHaveLength(1);
    expect(demoLinks[0]).toHaveAttribute("href", "/documents");
    expect(screen.getByRole("button", { name: "Sign in with Google" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sign up" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign up" })).not.toBeInTheDocument();
  });
});
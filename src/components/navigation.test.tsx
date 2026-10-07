// @vitest-environment jsdom
import "@/test/setup";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountControls } from "@/components/AccountControls";
import { BackLink } from "@/components/BackLink";
import { SettingsBack } from "@/components/SettingsBack";
import { readNavFrom, rememberNavFrom } from "@/lib/nav-return";

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
  usePathname: () => "/documents",
}));

function installMatchMedia(narrow: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: query.includes("max-width") ? narrow : query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
      onchange: null,
    }),
  });
}

describe("in-app back", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("names the destination and restores scroll on return", () => {
    render(<BackLink href="/documents">Documents</BackLink>);
    const link = screen.getByRole("link", { name: "Documents" });
    expect(link).toHaveAttribute("href", "/documents");
    expect(link).toHaveAttribute("data-scroll", "false");
    expect(link.className).toContain("min-h-11");
  });

  it("sends settings back to the screen you came from", () => {
    rememberNavFrom("/documents", "?demo=1");
    render(<SettingsBack />);
    expect(screen.getByRole("link", { name: "Documents" })).toHaveAttribute(
      "href",
      "/documents?demo=1",
    );
  });

  it("falls back to home when there is no previous screen", () => {
    sessionStorage.clear();
    expect(readNavFrom()).toEqual({ href: "/", label: "Home" });
    render(<SettingsBack />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });
});

describe("account menu", () => {
  beforeEach(() => {
    installMatchMedia(false);
  });

  it("shows documents, settings, and a confirm before sign out", async () => {
    const user = userEvent.setup();
    const signOutAction = vi.fn();
    render(
      <AccountControls
        name="Adhil Shanif"
        email="adhil@example.com"
        signOutAction={signOutAction}
      />,
    );

    expect(screen.getByRole("link", { name: "Documents" })).toHaveAttribute("href", "/documents");
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/settings");
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    const dialog = screen.getByRole("dialog", { name: "Sign out of DocTalk?" });
    await waitFor(() => {
      expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();
    });
    expect(signOutAction).not.toHaveBeenCalled();
  });

  it("opens the phone account menu and confirms sign out from there", async () => {
    installMatchMedia(true);
    const user = userEvent.setup();
    const signOutAction = vi.fn();
    render(
      <AccountControls
        name="Adhil Shanif"
        email="adhil@example.com"
        signOutAction={signOutAction}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Account menu for Adhil Shanif" }));
    const menu = screen.getByRole("menu", { name: "Account" });
    expect(within(menu).getByRole("menuitem", { name: "Documents" })).toHaveAttribute(
      "href",
      "/documents",
    );
    expect(within(menu).getByRole("menuitem", { name: "Settings" })).toBeInTheDocument();
    await user.click(within(menu).getByRole("menuitem", { name: "Sign out" }));
    expect(screen.getByRole("dialog", { name: "Sign out of DocTalk?" })).toBeInTheDocument();
    expect(signOutAction).not.toHaveBeenCalled();
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});

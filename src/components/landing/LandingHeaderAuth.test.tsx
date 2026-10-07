// @vitest-environment jsdom
import "@/test/setup";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LandingHeaderAuth } from "@/components/landing/LandingHeaderAuth";

vi.mock("@/lib/auth/actions", () => ({
  signInWithGoogle: vi.fn(),
}));

describe("Landing header auth", () => {
  it("shows one filled Sign in button and no Sign up", () => {
    render(<LandingHeaderAuth />);

    const signIn = screen.getByRole("button", { name: "Sign in" });
    expect(screen.queryByRole("button", { name: "Sign up" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sign up" })).not.toBeInTheDocument();
    expect(signIn.className).toContain("bg-[#4f46e5]");
    expect(signIn.className).toContain("whitespace-nowrap");
    expect(signIn.className).toContain("focus-visible:outline");
    expect(signIn.className).not.toMatch(/(?:^|\s)focus-within:|(?:^|\s)focus:(?:outline|ring)/);

    const form = signIn.closest("form");
    if (!form) throw new Error("Missing sign-in form");
    expect(form.querySelectorAll("button")).toHaveLength(1);
    expect(form.querySelector("input[name='redirectTo']")).toHaveAttribute("value", "/");
  });
});

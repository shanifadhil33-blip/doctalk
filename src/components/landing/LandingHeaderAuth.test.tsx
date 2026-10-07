// @vitest-environment jsdom
import "@/test/setup";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LandingHeaderAuth } from "@/components/landing/LandingHeaderAuth";

vi.mock("@/lib/auth/actions", () => ({
  signInWithGoogle: vi.fn(),
}));

describe("Landing header auth", () => {
  it("puts a quiet Sign in next to a filled Sign up, both on the Google form", () => {
    render(<LandingHeaderAuth />);

    const form = screen.getByRole("button", { name: "Sign up" }).closest("form");
    if (!form) throw new Error("Missing sign-up form");
    expect(form.className).toContain("flex-nowrap");
    expect(form).toContainElement(screen.getByRole("button", { name: "Sign in" }));

    const signIn = screen.getByRole("button", { name: "Sign in" });
    const signUp = screen.getByRole("button", { name: "Sign up" });
    expect(signIn.className).not.toContain("bg-[#4f46e5]");
    expect(signUp.className).toContain("bg-[#4f46e5]");
    expect(signUp.className).toContain("whitespace-nowrap");
    expect(form.querySelector("input[name='redirectTo']")).toHaveAttribute("value", "/");
  });
});

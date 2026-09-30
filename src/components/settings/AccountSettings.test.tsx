// @vitest-environment jsdom
import "@/test/setup";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AccountSettings } from "@/components/settings/AccountSettings";

describe("AccountSettings", () => {
  it("shows who is signed in and a sign out control", () => {
    const signOutAction = vi.fn();
    const { container } = render(
      <AccountSettings
        name="Adhil Shanif"
        email="adhil@example.com"
        signOutAction={signOutAction}
      />,
    );

    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByText("Adhil Shanif")).toBeInTheDocument();
    expect(screen.getByText("adhil@example.com")).toBeInTheDocument();
    expect(screen.getByText("Google")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/billing|upgrade|trial|paid plan/i);
  });

  it("still names the account when Google did not share an email", () => {
    render(
      <AccountSettings name="Signed in" email={null} signOutAction={() => undefined} />,
    );

    expect(screen.getByText("No email on this Google account")).toBeInTheDocument();
  });
});

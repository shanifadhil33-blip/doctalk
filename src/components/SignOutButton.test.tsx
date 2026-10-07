// @vitest-environment jsdom
import "@/test/setup";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignOutButton } from "@/components/SignOutButton";

const replace = vi.fn();

beforeEach(() => {
  replace.mockReset();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { replace, href: "http://localhost/" },
  });
});

describe("Sign out confirmation", () => {
  it("asks before signing out, and Cancel, Esc, and an outside tap stay signed in", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(<SignOutButton action={action} />);

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    const dialog = screen.getByRole("dialog", { name: "Sign out of DocTalk?" });
    expect(dialog.parentElement?.parentElement).toBe(document.body);
    expect(dialog.parentElement?.className).toContain("z-50");
    expect(dialog.className).toContain("z-[60]");
    expect(
      within(dialog).getByText("You'll need to sign in again to see your documents."),
    ).toBeInTheDocument();
    const confirm = within(dialog).getByRole("button", { name: "Sign out" });
    expect(confirm.className).toContain("bg-[#4f46e5]");
    expect(confirm.className).not.toMatch(/red-/);
    await waitFor(() => {
      expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();
    });

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(action).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Sign out" }));
    const reopen = screen.getByRole("dialog");
    const backdrop = reopen.parentElement;
    if (!backdrop) throw new Error("Missing dialog backdrop");
    fireEvent.pointerDown(backdrop);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(action).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Sign out" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(action).not.toHaveBeenCalled();
  });

  it("shows a busy state on Sign out, then runs the sign-out action", async () => {
    const user = userEvent.setup();
    let finish: () => void = () => {};
    const action = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    render(<SignOutButton action={action} />);

    await user.click(screen.getByRole("button", { name: "Sign out" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Sign out" }));

    const busy = within(screen.getByRole("dialog")).getByRole("button", { name: "Signing out" });
    expect(busy).toHaveAttribute("aria-busy", "true");
    expect(busy.querySelector("svg")).toBeInTheDocument();
    expect(action).toHaveBeenCalledOnce();

    finish();
    await waitFor(() => {
      expect(action).toHaveBeenCalledOnce();
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).getByRole("button", { name: "Signing out" })).toBeDisabled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("keeps Signing out and never shows an error when sign-out redirects", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => {
      const error = new Error("NEXT_REDIRECT");
      Object.assign(error, { digest: "NEXT_REDIRECT;replace;/;307;" });
      throw error;
    });
    render(<SignOutButton action={action} />);

    await user.click(screen.getByRole("button", { name: "Sign out" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/");
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("Couldn't sign out. Try again.")).not.toBeInTheDocument();
    const busy = within(screen.getByRole("dialog")).getByRole("button", { name: "Signing out" });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute("aria-busy", "true");
    expect(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("shows the error and re-enables the buttons when sign-out fails", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async () => {
      throw new Error("network down");
    });
    render(<SignOutButton action={action} />);

    await user.click(screen.getByRole("button", { name: "Sign out" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Sign out" }));

    const dialog = screen.getByRole("dialog");
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Couldn't sign out. Try again.");
    const retry = within(dialog).getByRole("button", { name: "Sign out" });
    expect(retry).toBeEnabled();
    expect(retry).not.toHaveAttribute("aria-busy", "true");
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeEnabled();
    expect(replace).not.toHaveBeenCalled();
  });
});
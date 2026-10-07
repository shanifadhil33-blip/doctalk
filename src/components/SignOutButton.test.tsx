// @vitest-environment jsdom
import "@/test/setup";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SignOutButton } from "@/components/SignOutButton";

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
  });
});
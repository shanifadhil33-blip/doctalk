// @vitest-environment jsdom
import "@/test/setup";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { COPY_FEEDBACK_MS, CopyTextButton } from "@/components/CopyTextButton";

function installClipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
}

describe("CopyTextButton", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("copies with the keyboard and returns to Copy", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    installClipboard(writeText);

    render(<CopyTextButton text="60 days written notice" label="Copy answer" />);
    const button = screen.getByRole("button", { name: "Copy answer" });
    button.focus();
    expect(button).toHaveFocus();
    await user.click(button);

    expect(writeText).toHaveBeenCalledWith("60 days written notice");
    expect(button).toHaveTextContent("Copied");
    expect(button).toHaveAccessibleName("Copied");

    await new Promise((resolve) => {
      setTimeout(resolve, COPY_FEEDBACK_MS + 40);
    });
    expect(button).toHaveTextContent("Copy");
    expect(button).toHaveAccessibleName("Copy answer");
  });

  it("stays on Copy when the clipboard rejects the text", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    installClipboard(writeText);
    document.execCommand = vi.fn().mockReturnValue(false);

    render(<CopyTextButton text="passage" label="Copy passage" />);
    await user.click(screen.getByRole("button", { name: "Copy passage" }));

    expect(writeText).toHaveBeenCalledWith("passage");
    expect(screen.getByRole("button", { name: "Copy passage" })).toHaveTextContent("Copy");
  });
});

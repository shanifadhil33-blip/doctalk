// @vitest-environment jsdom
import "@/test/setup";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CitationChip, citationChipClass } from "@/components/workspace/CitationChip";

describe("CitationChip", () => {
  it("shows Source p. 3 and reports that page", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CitationChip page={3} onSelect={onSelect} />);

    const chip = screen.getByRole("button", { name: "Show source on page 3" });
    expect(chip).toHaveTextContent("Source p. 3");

    await user.click(chip);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(3);
  });

  it("keeps a visible hover and press state when the chip is selected", () => {
    expect(citationChipClass(false)).toContain("cursor-pointer");
    expect(citationChipClass(false)).toContain("bg-slate-100");
    expect(citationChipClass(false)).toContain("hover:bg-slate-200");
    expect(citationChipClass(false)).toContain("active:bg-slate-300");
    expect(citationChipClass(true)).toContain("bg-[#eef0ff]");
    expect(citationChipClass(true)).toContain("hover:bg-[#e0e4ff]");
    expect(citationChipClass(true)).toContain("active:bg-[#d4d8fb]");
    expect(citationChipClass(true)).toContain("focus-visible:outline");
    expect(`${citationChipClass(false)} ${citationChipClass(true)}`).not.toMatch(/#f[0-9a-f]{5}|amber|yellow|gold/i);
  });
});

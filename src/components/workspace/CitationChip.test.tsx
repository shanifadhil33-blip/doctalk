import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CitationChip } from "@/components/workspace/CitationChip";

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
});

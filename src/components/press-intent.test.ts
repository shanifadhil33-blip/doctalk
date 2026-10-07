import { describe, expect, it, vi } from "vitest";
import { blockScrollClick, pointerMoved } from "@/components/press-intent";

describe("press intent", () => {
  it("treats a short press as a tap and a moved press as a scroll", () => {
    const start = { x: 10, y: 10 };
    expect(pointerMoved(start, { clientX: 12, clientY: 14 })).toBe(false);
    expect(pointerMoved(start, { clientX: 10, clientY: 19 })).toBe(true);
    expect(pointerMoved(null, { clientX: 40, clientY: 40 })).toBe(false);

    const tap = { clientX: 12, clientY: 12, preventDefault: vi.fn() };
    expect(blockScrollClick(start, tap)).toBe(false);
    expect(tap.preventDefault).not.toHaveBeenCalled();

    const scroll = { clientX: 10, clientY: 40, preventDefault: vi.fn() };
    expect(blockScrollClick(start, scroll)).toBe(true);
    expect(scroll.preventDefault).toHaveBeenCalledOnce();
  });
});
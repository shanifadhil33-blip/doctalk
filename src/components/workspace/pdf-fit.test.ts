import { describe, expect, it } from "vitest";
import { fittedPageWidth } from "@/components/workspace/pdf-fit";

describe("fittedPageWidth", () => {
  it("matches the pane at 100 percent so a phone does not grow past the screen", () => {
    expect(fittedPageWidth(360, 100)).toBe(360);
    expect(fittedPageWidth(390, 100)).toBeLessThan(400);
    expect(fittedPageWidth(720, 100)).toBe(720);
  });

  it("scales with zoom and ignores an unmeasured pane", () => {
    expect(fittedPageWidth(360, 150)).toBe(540);
    expect(fittedPageWidth(0, 100)).toBe(0);
    expect(fittedPageWidth(Number.NaN, 100)).toBe(0);
  });
});

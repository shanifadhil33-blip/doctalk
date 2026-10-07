import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("tap focus", () => {
  it("drops the outline after a tap, including a focused drop zone, and keeps a keyboard ring", () => {
    const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");
    expect(css).toContain('html[data-input="pointer"] :focus-within');
    expect(css).toContain("outline: none !important");
    expect(css).toContain("-webkit-tap-highlight-color: transparent");
    expect(css).toContain(':where(html[data-input="keyboard"]) :focus-visible');
    expect(css).toContain("outline: 1px solid var(--brand)");
  });
});

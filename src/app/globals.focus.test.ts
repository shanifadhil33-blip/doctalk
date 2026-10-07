import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return entry.name.endsWith(".tsx") || entry.name.endsWith(".ts") ? [full] : [];
  });
}

describe("tap focus", () => {
  it("drops the outline after a tap, including a focused drop zone, and keeps a keyboard ring", () => {
    const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");
    expect(css).toContain('html[data-input="pointer"] :focus-within');
    expect(css).toContain("outline: none !important");
    expect(css).toContain("-webkit-tap-highlight-color: transparent");
    expect(css).toContain(':where(html[data-input="keyboard"]) :focus-visible');
    expect(css).toContain("outline: 1px solid var(--brand)");
    expect(css).not.toContain("view-transition-name");
  });

  it("does not paint a focus ring from focus-within or a pointer focus outline", () => {
    const offenders = sourceFiles(path.join(process.cwd(), "src")).filter((file) => {
      if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) return false;
      const text = readFileSync(file, "utf8");
      return text.includes("focus-within:") || /(?<!-)focus:(outline|ring)/.test(text);
    });
    expect(offenders).toEqual([]);
  });
});

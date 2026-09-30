// @vitest-environment jsdom
import "@/test/setup";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MarkdownPane } from "@/components/workspace/MarkdownPane";
import { findExcerptInRoot } from "@/components/workspace/scroll-passage";

const note = [
  "# 1. Opening",
  "The desk opens at 8:30.",
  "",
  "# 2. The loop",
  "Run the check, then send the report.",
  "",
  "# 4. Review steps",
  "Write the boundary before the prompt.",
].join("\n");

describe("MarkdownPane", () => {
  it("scrolls to a cited heading even when the section number stays the same", () => {
    const scrollTo = vi.fn();
    HTMLElement.prototype.scrollTo = scrollTo;

    const view = render(<MarkdownPane fileUrl="/note.md" section={1} source={note} />);
    expect(scrollTo).not.toHaveBeenCalled();

    view.rerender(
      <MarkdownPane
        fileUrl="/note.md"
        section={1}
        source={note}
        focusKey={1}
        heading="4. Review steps"
        excerpt="Write the boundary before the prompt."
      />,
    );

    const pane = document.getElementById("pdf-scroll");
    expect(scrollTo.mock.instances).toContain(pane);
    expect(document.querySelector('[data-md-heading="4. Review steps"]')).toBeTruthy();
  });

  it("finds a cited sentence that is split across the heading and the body", () => {
    const root = document.createElement("article");
    root.innerHTML = "<h2>4. Review steps</h2><p>Write the boundary before the prompt.</p>";
    document.body.append(root);
    const fromHeading = findExcerptInRoot(root, "4. Review steps Write the boundary before the prompt.");
    expect(fromHeading?.node.textContent).toContain("4. Review steps");
    const fromBody = findExcerptInRoot(root, "Write the boundary before the prompt.");
    expect(fromBody?.node.textContent).toContain("boundary");
    root.remove();
  });
});

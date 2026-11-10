// @vitest-environment jsdom
import "@/test/setup";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AnswerText, answerPlainText, parseAnswerBlocks } from "@/components/workspace/AnswerText";
import { documentDisplayName } from "@/lib/documents/display-name";

describe("AnswerText", () => {
  it("renders bold, lists, and paragraphs instead of raw marks", () => {
    const { container } = render(
      <AnswerText text={"**Total due:** 2440.00 USD\n\n- Layout fee\n- Courier\n\n1. First\n2. Second"} />,
    );
    expect(screen.getByText("Total due:").tagName).toBe("STRONG");
    expect(container.querySelectorAll("ul > li")).toHaveLength(2);
    expect(container.querySelectorAll("ol > li")).toHaveLength(2);
    expect(container.textContent).not.toContain("**");
    expect(container.textContent).not.toMatch(/^- /m);
  });

  it("never treats answer text as HTML", () => {
    const { container } = render(<AnswerText text={'<img src=x onerror="alert(1)"> and <b>bold</b>'} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
    expect(container.textContent).toContain("<img src=x");
  });

  it("keeps underscores inside words", () => {
    const { container } = render(<AnswerText text="See file_name_here for details." />);
    expect(container.querySelector("em")).toBeNull();
    expect(container.textContent).toBe("See file_name_here for details.");
  });

  it("keeps the not-in-document answer as one plain paragraph", () => {
    expect(parseAnswerBlocks("That is not in this document.")).toEqual([
      { kind: "paragraph", lines: ["That is not in this document."] },
    ]);
  });

  it("copies the answer without Markdown marks", () => {
    expect(answerPlainText("## Fees\n**Total:** `2440`")).toBe("Fees\nTotal: 2440");
  });
});

describe("documentDisplayName", () => {
  it("turns stored file names into readable titles", () => {
    expect(documentDisplayName("Sample_Invoice.pdf")).toBe("Sample Invoice");
    expect(documentDisplayName("Sample_Visitor_Note.md")).toBe("Sample Visitor Note");
    expect(documentDisplayName("Q3 report (final).PDF")).toBe("Q3 report (final)");
    expect(documentDisplayName(".pdf")).toBe(".pdf");
  });
});

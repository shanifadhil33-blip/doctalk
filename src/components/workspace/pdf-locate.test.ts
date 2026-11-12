import { describe, expect, it } from "vitest";
import { locatePassage, matchKey } from "@/components/workspace/pdf-locate";

const cvSpans = [
  "RELEVANT ENGINEERING EXPERIENCE",
  " Managed feature delivery, client feedback, testing, fixes and technical",
  "decisions; earned repeat paid work from an international founder.",
  "TECHNICAL SKILLS",
  "Development: ",
  "TypeScript, JavaScript, Next.js, React, Tailwind CSS, full-stack web development,",
  "REST APIs",
  "Data & security: PostgreSQL, Supabase, authentication",
];

describe("locatePassage", () => {
  it("finds a passage across spans despite spacing, bullets and punctuation", () => {
    const found = locatePassage(cvSpans, "TECHNICAL SKILLS Development: TypeScript, JavaScript, Next.js, React");
    expect(found?.first).toBe(3);
    expect(found?.last).toBe(5);
  });

  it("skips a partial first word", () => {
    const found = locatePassage(cvSpans, "ns. • Managed feature delivery, client feedback, testing");
    expect(found?.first).toBe(1);
  });

  it("returns null when the text is not on the page", () => {
    expect(locatePassage(cvSpans, "Quarterly revenue grew by twelve percent in Europe")).toBeNull();
    expect(locatePassage([], "anything at all here")).toBeNull();
  });

  it("compares letters and digits only", () => {
    expect(matchKey("Next.js, React!   ")).toBe("nextjsreact");
  });
});

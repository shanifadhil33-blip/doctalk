import { describe, expect, it } from "vitest";
import {
  OFFLINE_SAMPLE_SOURCE_HREF,
  resolveSampleSourceHref,
} from "@/lib/documents/sample-source";

describe("resolveSampleSourceHref", () => {
  it("keeps the offline sample route when there is no database", () => {
    expect(resolveSampleSourceHref(false, null)).toBe(OFFLINE_SAMPLE_SOURCE_HREF);
  });

  it("links a seeded demo document on page 3", () => {
    expect(
      resolveSampleSourceHref(true, "11111111-1111-1111-1111-111111111111"),
    ).toBe("/documents/11111111-1111-1111-1111-111111111111?page=3");
  });

  it("does not link the offline slug when the database has no matching demo", () => {
    expect(resolveSampleSourceHref(true, null)).toBe("/documents");
    expect(resolveSampleSourceHref(true, null)).not.toContain(
      "master-services-agreement",
    );
  });
});

import { describe, expect, it } from "vitest";
import { isNextRedirect } from "@/lib/auth/redirect-error";

describe("isNextRedirect", () => {
  it("recognizes a Next redirect digest and a wrapped cause", () => {
    const redirect = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;push;/;303;",
    });
    expect(isNextRedirect(redirect)).toBe(true);
    expect(isNextRedirect(Object.assign(new Error("wrapped"), { cause: redirect }))).toBe(true);
  });

  it("does not treat a network error as a redirect", () => {
    expect(isNextRedirect(new Error("Failed to fetch"))).toBe(false);
    expect(isNextRedirect(Object.assign(new Error("nope"), { digest: "OTHER" }))).toBe(false);
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { signedInPreviewEnabled } from "@/lib/preview-access";

const originalPreview = process.env.DOCTALK_SIGNED_IN_PREVIEW;
const originalVercel = process.env.VERCEL;

afterEach(() => {
  if (originalPreview === undefined) delete process.env.DOCTALK_SIGNED_IN_PREVIEW;
  else process.env.DOCTALK_SIGNED_IN_PREVIEW = originalPreview;
  if (originalVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = originalVercel;
});

describe("signed-in preview", () => {
  it("stays off in production and on Vercel", () => {
    delete process.env.DOCTALK_SIGNED_IN_PREVIEW;
    delete process.env.VERCEL;
    expect(signedInPreviewEnabled()).toBe(false);

    process.env.DOCTALK_SIGNED_IN_PREVIEW = "1";
    expect(signedInPreviewEnabled()).toBe(true);

    process.env.VERCEL = "1";
    expect(signedInPreviewEnabled()).toBe(false);
  });
});

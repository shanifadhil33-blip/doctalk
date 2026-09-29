import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/auth";
import { handleUpload } from "@vercel/blob/client";
import { PDF_LIMIT_MESSAGE } from "@/lib/documents/upload-policy";
import { reserveOwnedUpload } from "@/lib/documents/reserve-slot";
import { MAX_PDF_BYTES } from "@/lib/upload-validation";
import { POST } from "./route";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@vercel/blob/client", () => ({
  handleUpload: vi.fn(),
}));

vi.mock("@/lib/documents/reserve-slot", () => ({
  reserveOwnedUpload: vi.fn(),
}));

const uploadId = "00000000-0000-4000-8000-000000000001";

function tokenRequest(overrides: Record<string, unknown> = {}) {
  return new Request("https://doctalk.example/api/documents/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "blob.generate-client-token",
      payload: {
        pathname: `uploads/${uploadId}.pdf`,
        multipart: false,
        clientPayload: JSON.stringify({
          uploadId,
          fileName: "notes.pdf",
          size: 2048,
          type: "application/pdf",
          ...overrides,
        }),
      },
    }),
  });
}

describe("POST /api/documents/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_URL = "postgres://example";
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_test";
    vi.mocked(handleUpload).mockImplementation(async (options) => {
      if (options.body.type !== "blob.generate-client-token") {
        throw new Error("unexpected body");
      }
      const issued = await options.onBeforeGenerateToken(
        options.body.payload.pathname,
        options.body.payload.clientPayload,
        options.body.payload.multipart,
      );
      return {
        type: "blob.generate-client-token",
        clientToken: JSON.stringify(issued),
      };
    });
  });

  it("rejects a signed-out caller", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const response = await POST(tokenRequest());
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Sign in required" });
    expect(reserveOwnedUpload).not.toHaveBeenCalled();
  });

  it("rejects a non-PDF before issuing a token", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    const response = await POST(tokenRequest({ type: "text/plain" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Only PDF files can be uploaded." });
    expect(reserveOwnedUpload).not.toHaveBeenCalled();
  });

  it("rejects a file over 10 MB", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    const response = await POST(tokenRequest({ size: MAX_PDF_BYTES + 1 }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "PDF must be 10 MB or smaller." });
  });

  it("rejects the token when the account is at the document cap", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    vi.mocked(reserveOwnedUpload).mockResolvedValue({
      ok: false,
      message: PDF_LIMIT_MESSAGE,
    });
    const response = await POST(tokenRequest());
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: PDF_LIMIT_MESSAGE });
  });

  it("issues a PDF-only token after the slot is reserved", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1" } } as never);
    vi.mocked(reserveOwnedUpload).mockResolvedValue({ ok: true, documentId: "doc-1" });
    const response = await POST(tokenRequest());
    expect(response.status).toBe(200);
    const body = (await response.json()) as { clientToken: string };
    const issued = JSON.parse(body.clientToken) as {
      allowedContentTypes: string[];
      maximumSizeInBytes: number;
      addRandomSuffix: boolean;
      tokenPayload: string;
    };
    expect(issued.allowedContentTypes).toEqual(["application/pdf"]);
    expect(issued.maximumSizeInBytes).toBe(MAX_PDF_BYTES);
    expect(issued.addRandomSuffix).toBe(true);
    expect(JSON.parse(issued.tokenPayload)).toEqual({
      userId: "user-1",
      uploadId,
      documentId: "doc-1",
    });
  });
});

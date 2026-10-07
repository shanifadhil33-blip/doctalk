import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearSession } from "@/lib/auth/clear-session";
import { POST } from "./route";

vi.mock("@/lib/auth/clear-session", () => ({
  clearSession: vi.fn(),
}));

function request(origin: string | null, host = "doctalk.example") {
  const headers = new Headers({ host });
  if (origin) headers.set("origin", origin);
  return new Request("https://doctalk.example/api/auth/sign-out", { method: "POST", headers });
}

describe("POST /api/auth/sign-out", () => {
  beforeEach(() => {
    vi.mocked(clearSession).mockReset();
    vi.mocked(clearSession).mockResolvedValue(undefined);
  });

  it("clears the session and returns ok for a same-origin request", async () => {
    const response = await POST(request("https://doctalk.example"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(clearSession).toHaveBeenCalledOnce();
  });

  it("does not clear the session for a cross-origin request", async () => {
    const response = await POST(request("https://evil.example"));
    expect(response.status).toBe(403);
    expect(clearSession).not.toHaveBeenCalled();
  });

  it("returns a server error when the session clear fails", async () => {
    vi.mocked(clearSession).mockRejectedValue(new Error("cookie store unavailable"));
    const response = await POST(request("https://doctalk.example"));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false });
  });
});

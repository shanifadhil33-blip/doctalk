import { beforeEach, describe, expect, it, vi } from "vitest";
import { signOut } from "@/auth";
import { clearSession } from "@/lib/auth/clear-session";

vi.mock("@/auth", () => ({
  signOut: vi.fn(),
}));

describe("clearSession", () => {
  beforeEach(() => {
    vi.mocked(signOut).mockReset();
  });

  it("clears the session without asking Auth.js to redirect", async () => {
    vi.mocked(signOut).mockResolvedValue(undefined as never);
    await clearSession();
    expect(signOut).toHaveBeenCalledWith({ redirect: false, redirectTo: "/" });
  });

  it("treats a thrown redirect as a cleared session", async () => {
    const error = new Error("NEXT_REDIRECT");
    Object.assign(error, { digest: "NEXT_REDIRECT;replace;/;307;" });
    vi.mocked(signOut).mockRejectedValue(error);
    await expect(clearSession()).resolves.toBeUndefined();
  });

  it("rethrows a real failure", async () => {
    vi.mocked(signOut).mockRejectedValue(new Error("session store down"));
    await expect(clearSession()).rejects.toThrow("session store down");
  });
});

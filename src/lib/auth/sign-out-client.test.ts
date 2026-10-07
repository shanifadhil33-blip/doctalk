// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { signOutToLanding } from "@/lib/auth/sign-out-client";

const replace = vi.fn();

function installLocation() {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { replace, href: "http://127.0.0.1:3456/" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  replace.mockReset();
});

describe("signOutToLanding", () => {
  it("sends one sign-out request and then loads the landing page", async () => {
    installLocation();
    const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async () =>
      Response.json({ ok: true }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const pending = signOutToLanding();
    await vi.waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/");
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    if (!init) throw new Error("Missing sign-out request");
    expect(url).toBe("/api/auth/sign-out");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("same-origin");
    expect(init.redirect).toBe("manual");

    let settled = false;
    void pending.then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
  });

  it("rejects on a server error and does not navigate", async () => {
    installLocation();
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ ok: false }, { status: 500 })));

    await expect(signOutToLanding()).rejects.toThrow("Couldn't sign out");
    expect(replace).not.toHaveBeenCalled();
  });

  it("rejects a non-JSON success body and does not navigate", async () => {
    installLocation();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html></html>", { status: 200, headers: { "content-type": "text/html" } })),
    );

    await expect(signOutToLanding()).rejects.toThrow("Couldn't sign out");
    expect(replace).not.toHaveBeenCalled();
  });

  it("rejects when the request never leaves the browser", async () => {
    installLocation();
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));

    await expect(signOutToLanding()).rejects.toThrow("Couldn't sign out");
    expect(replace).not.toHaveBeenCalled();
  });
});

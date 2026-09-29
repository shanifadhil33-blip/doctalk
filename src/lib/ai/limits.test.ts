import { describe, expect, it } from "vitest";
import { chatModelFromEnv, openRouterModelFromEnv, sendChatWithFallback } from "./chat";
import { DEMO_LIMIT_MESSAGE, demoLimitMessage, providerStatus } from "./limits";

function env(values: Record<string, string | undefined>): NodeJS.ProcessEnv {
  return { NODE_ENV: "test", ...values };
}

class StatusError extends Error {
  readonly statusCode: number;
  constructor(statusCode: number) {
    super(`status ${statusCode}`);
    this.statusCode = statusCode;
  }
}

describe("demo limit mapping", () => {
  it("maps 429 and 402 to the friendly message", () => {
    expect(demoLimitMessage(new StatusError(429))).toBe(DEMO_LIMIT_MESSAGE);
    expect(demoLimitMessage(new StatusError(402))).toBe(DEMO_LIMIT_MESSAGE);
    expect(demoLimitMessage({ status: 429 })).toBe(DEMO_LIMIT_MESSAGE);
    expect(demoLimitMessage({ cause: { statusCode: 402 } })).toBe(
      DEMO_LIMIT_MESSAGE,
    );
  });

  it("ignores other failures", () => {
    expect(demoLimitMessage(new StatusError(500))).toBeNull();
    expect(demoLimitMessage(new Error("network"))).toBeNull();
    expect(providerStatus(new Error("network"))).toBeUndefined();
  });
});

describe("chat model env", () => {
  it("defaults the Gemini chat model and reads overrides", () => {
    expect(chatModelFromEnv(env({}))).toBe("gemini-3.5-flash-lite");
    expect(chatModelFromEnv(env({ CHAT_MODEL: " gemini-3.5-flash " }))).toBe(
      "gemini-3.5-flash",
    );
    expect(openRouterModelFromEnv(env({}))).toBeNull();
    expect(
      openRouterModelFromEnv(env({ OPENROUTER_MODEL: " free-model " })),
    ).toBe("free-model");
  });
});

describe("sendChatWithFallback", () => {
  it("tries the next provider after a limit error", async () => {
    const calls: string[] = [];
    const response = await sendChatWithFallback([
      {
        name: "gemini",
        async send() {
          calls.push("gemini");
          throw new StatusError(429);
        },
      },
      {
        name: "openrouter",
        async send() {
          calls.push("openrouter");
          return Response.json({ ok: true });
        },
      },
    ]);

    expect(calls).toEqual(["gemini", "openrouter"]);
    expect(response.status).toBe(200);
  });

  it("returns the friendly message when every provider is limited", async () => {
    const response = await sendChatWithFallback([
      {
        name: "gemini",
        async send() {
          throw new StatusError(429);
        },
      },
      {
        name: "openrouter",
        async send() {
          throw new StatusError(402);
        },
      },
    ]);

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Demo limit reached, try again later",
    });
  });

  it("rethrows errors that are not a demo limit", async () => {
    await expect(
      sendChatWithFallback([
        {
          name: "gemini",
          async send() {
            throw new StatusError(500);
          },
        },
      ]),
    ).rejects.toThrow("status 500");
  });

  it("reports when no provider is configured", async () => {
    const response = await sendChatWithFallback([]);
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Chat is not configured",
    });
  });
});

import { describe, expect, it, vi } from "vitest";

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return {
    ...actual,
    // A model call that never answers until it is cancelled.
    generateText: ({ abortSignal }: { abortSignal?: AbortSignal }) =>
      new Promise((_, reject) => {
        abortSignal?.addEventListener("abort", () =>
          reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
        );
      }),
  };
});

import { ChatTimeoutError, completePrompt } from "@/lib/ai/chat";

describe("completePrompt time limit", () => {
  it("gives up with ChatTimeoutError instead of hanging", async () => {
    await expect(
      completePrompt({ GEMINI_API_KEY: "test-key" } as unknown as NodeJS.ProcessEnv, "prompt", 50),
    ).rejects.toBeInstanceOf(ChatTimeoutError);
  });

  it("does not try the fallback once the time is used up", async () => {
    const started = Date.now();
    await expect(
      completePrompt(
        { GEMINI_API_KEY: "a", OPENROUTER_API_KEY: "b", OPENROUTER_MODEL: "m" } as unknown as NodeJS.ProcessEnv,
        "prompt",
        50,
      ),
    ).rejects.toBeInstanceOf(ChatTimeoutError);
    expect(Date.now() - started).toBeLessThan(1000);
  });
});

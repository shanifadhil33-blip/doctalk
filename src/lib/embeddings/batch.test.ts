import { describe, expect, it } from "vitest";
import { EMBEDDING_DIMENSIONS, type EmbeddingClient } from "@/lib/embeddings/embed";
import { embedTexts } from "@/lib/embeddings/batch";

function unitVector(): number[] {
  const values = Array.from({ length: EMBEDDING_DIMENSIONS }, () => 0);
  values[0] = 1;
  return values;
}

describe("embedTexts", () => {
  it("retries a 429 with backoff and then returns the embedding", async () => {
    let calls = 0;
    const client: EmbeddingClient = {
      async embedContent() {
        calls += 1;
        if (calls < 3) {
          const error = new Error("limited");
          Object.assign(error, { statusCode: 429 });
          throw error;
        }
        return { values: unitVector() };
      },
    };
    const sleeps: number[] = [];
    const vectors = await embedTexts(["hello"], client, "gemini-embedding-2", {
      maxAttempts: 4,
      sleep: async (ms) => {
        sleeps.push(ms);
      },
    });

    expect(calls).toBe(3);
    expect(sleeps).toEqual([200, 400]);
    expect(vectors[0]).toHaveLength(EMBEDDING_DIMENSIONS);
  });

  it("does not retry errors other than 429", async () => {
    let calls = 0;
    const client: EmbeddingClient = {
      async embedContent() {
        calls += 1;
        const error = new Error("unavailable");
        Object.assign(error, { statusCode: 500 });
        throw error;
      },
    };

    await expect(
      embedTexts(["hello"], client, "gemini-embedding-2", {
        sleep: async () => {},
      }),
    ).rejects.toThrow("unavailable");
    expect(calls).toBe(1);
  });
});

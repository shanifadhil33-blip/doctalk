import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
  embedText,
  embeddingModelFromEnv,
  l2Norm,
  type EmbeddingClient,
} from "./embed";
import { createGeminiEmbeddingClient } from "./gemini";

function vector(first: number, second = 0): number[] {
  const values = Array.from({ length: EMBEDDING_DIMENSIONS }, () => 0);
  values[0] = first;
  values[1] = second;
  return values;
}

function env(values: Record<string, string | undefined>): NodeJS.ProcessEnv {
  return { NODE_ENV: "test", ...values };
}

describe("embeddingModelFromEnv", () => {
  it("defaults to gemini-embedding-2", () => {
    expect(embeddingModelFromEnv(env({}))).toBe(DEFAULT_EMBEDDING_MODEL);
    expect(embeddingModelFromEnv(env({ EMBEDDING_MODEL: "  " }))).toBe(
      DEFAULT_EMBEDDING_MODEL,
    );
  });

  it("reads EMBEDDING_MODEL", () => {
    expect(embeddingModelFromEnv(env({ EMBEDDING_MODEL: " custom-model " }))).toBe(
      "custom-model",
    );
  });
});

describe("embedText", () => {
  it("asks the client for 768 dimensions and L2-normalizes when needed", async () => {
    const embedContent = vi.fn<EmbeddingClient["embedContent"]>(
      async () => ({ values: vector(3, 4) }),
    );
    const client: EmbeddingClient = { embedContent };

    const embedding = await embedText("invoice total", client, "gemini-embedding-2");

    expect(embedContent).toHaveBeenCalledWith({
      model: "gemini-embedding-2",
      text: "invoice total",
      outputDimensionality: EMBEDDING_DIMENSIONS,
    });
    expect(embedding).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(embedding[0]).toBeCloseTo(0.6);
    expect(embedding[1]).toBeCloseTo(0.8);
    expect(l2Norm(embedding)).toBeCloseTo(1);
  });

  it("leaves an already unit-length vector unchanged", async () => {
    const unit = vector(1, 0);
    const client: EmbeddingClient = {
      async embedContent() {
        return { values: unit };
      },
    };

    const embedding = await embedText("ready", client, DEFAULT_EMBEDDING_MODEL);

    expect(embedding).toEqual(unit);
    expect(embedding).not.toBe(unit);
  });

  it("rejects the wrong number of dimensions", async () => {
    const client: EmbeddingClient = {
      async embedContent() {
        return { values: [1, 0, 0] };
      },
    };

    await expect(embedText("short", client, DEFAULT_EMBEDDING_MODEL)).rejects.toThrow(
      "Expected 768 embedding dimensions, received 3",
    );
  });
});

describe("createGeminiEmbeddingClient", () => {
  it("posts output_dimensionality 768 and reads embedding.values", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      return new Response(
        JSON.stringify({ embedding: { values: vector(1, 0) } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    const client = createGeminiEmbeddingClient({
      apiKey: "test-key",
      fetchImpl,
    });

    const result = await client.embedContent({
      model: "gemini-embedding-2",
      text: "hello",
      outputDimensionality: EMBEDDING_DIMENSIONS,
    });

    expect(result.values).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent",
    );
    expect(init?.method).toBe("POST");
    const headers = new Headers(init?.headers);
    expect(headers.get("x-goog-api-key")).toBe("test-key");
    expect(JSON.parse(String(init?.body))).toEqual({
      content: { parts: [{ text: "hello" }] },
      output_dimensionality: 768,
    });
  });
});

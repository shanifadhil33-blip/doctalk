import type { EmbeddingClient } from "@/lib/embeddings/embed";

const GEMINI_EMBED_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

export function createGeminiEmbeddingClient(options: {
  apiKey: string;
  fetchImpl?: typeof fetch;
}): EmbeddingClient {
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    async embedContent({ model, text, outputDimensionality }) {
      const response = await fetchImpl(
        `${GEMINI_EMBED_URL}/${encodeURIComponent(model)}:embedContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": options.apiKey,
          },
          body: JSON.stringify({
            content: { parts: [{ text }] },
            output_dimensionality: outputDimensionality,
          }),
        },
      );

      if (!response.ok) {
        const error = new Error(
          `Gemini embedding request failed (${response.status})`,
        );
        Object.assign(error, { statusCode: response.status });
        throw error;
      }

      const values = readEmbeddingValues(await response.json());
      if (!values) {
        throw new Error("Gemini embedding response did not include values");
      }
      if (values.length !== outputDimensionality) {
        throw new Error(
          `Expected ${outputDimensionality} embedding dimensions, received ${values.length}`,
        );
      }

      return { values };
    },
  };
}

function readEmbeddingValues(payload: unknown): number[] | null {
  if (!isRecord(payload) || !isRecord(payload.embedding)) {
    return null;
  }

  const values = payload.embedding.values;
  if (!Array.isArray(values) || values.some((value) => typeof value !== "number")) {
    return null;
  }

  return values;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

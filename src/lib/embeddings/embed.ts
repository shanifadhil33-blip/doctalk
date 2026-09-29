export const EMBEDDING_DIMENSIONS = 768;
export const DEFAULT_EMBEDDING_MODEL = "gemini-embedding-2";

const UNIT_EPSILON = 1e-3;

export type EmbeddingClient = {
  embedContent(input: {
    model: string;
    text: string;
    outputDimensionality: number;
  }): Promise<{ values: number[] }>;
};

export function embeddingModelFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const model = env.EMBEDDING_MODEL?.trim();
  return model ? model : DEFAULT_EMBEDDING_MODEL;
}

export function l2Norm(values: readonly number[]): number {
  let sum = 0;
  for (const value of values) {
    sum += value * value;
  }
  return Math.sqrt(sum);
}

/** gemini-embedding-2 already unit-normalizes 768-d output. Normalize only when it does not. */
export function l2NormalizeIfNeeded(values: readonly number[]): number[] {
  const norm = l2Norm(values);
  if (norm === 0) {
    throw new Error("Cannot normalize a zero embedding");
  }
  if (Math.abs(norm - 1) <= UNIT_EPSILON) {
    return [...values];
  }
  return values.map((value) => value / norm);
}

export async function embedText(
  text: string,
  client: EmbeddingClient,
  model: string,
): Promise<number[]> {
  const { values } = await client.embedContent({
    model,
    text,
    outputDimensionality: EMBEDDING_DIMENSIONS,
  });

  if (values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Expected ${EMBEDDING_DIMENSIONS} embedding dimensions, received ${values.length}`,
    );
  }

  return l2NormalizeIfNeeded(values);
}

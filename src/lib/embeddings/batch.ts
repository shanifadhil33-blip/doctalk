import { providerStatus } from "@/lib/ai/limits";
import {
  embedText,
  type EmbeddingClient,
} from "@/lib/embeddings/embed";

const DEFAULT_BATCH_SIZE = 4;
const DEFAULT_MAX_ATTEMPTS = 4;

export async function embedTexts(
  texts: readonly string[],
  client: EmbeddingClient,
  model: string,
  options?: {
    batchSize?: number;
    maxAttempts?: number;
    sleep?: (ms: number) => Promise<void>;
  },
): Promise<number[][]> {
  const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
  const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const sleep = options?.sleep ?? delay;
  const vectors: number[][] = [];

  for (let index = 0; index < texts.length; index += batchSize) {
    const batch = texts.slice(index, index + batchSize);
    const embedded = await Promise.all(
      batch.map((text) => embedWithRetry(text, client, model, maxAttempts, sleep)),
    );
    vectors.push(...embedded);
  }

  return vectors;
}

async function embedWithRetry(
  text: string,
  client: EmbeddingClient,
  model: string,
  maxAttempts: number,
  sleep: (ms: number) => Promise<void>,
): Promise<number[]> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await embedText(text, client, model);
    } catch (error) {
      lastError = error;
      if (providerStatus(error) !== 429 || attempt === maxAttempts) {
        throw error;
      }
      await sleep(200 * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

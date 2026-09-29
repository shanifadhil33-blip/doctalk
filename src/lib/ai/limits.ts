import { APICallError } from "ai";

export const DEMO_LIMIT_MESSAGE = "Demo limit reached, try again later";

export function providerStatus(error: unknown): number | undefined {
  if (APICallError.isInstance(error) && typeof error.statusCode === "number") {
    return error.statusCode;
  }

  if (typeof error === "object" && error !== null) {
    if ("statusCode" in error && typeof error.statusCode === "number") {
      return error.statusCode;
    }
    if ("status" in error && typeof error.status === "number") {
      return error.status;
    }
    if ("cause" in error) {
      return providerStatus(error.cause);
    }
  }

  return undefined;
}

export function demoLimitMessage(error: unknown): string | null {
  const status = providerStatus(error);
  if (status === 429 || status === 402) {
    return DEMO_LIMIT_MESSAGE;
  }
  return null;
}

export function demoLimitResponse(): Response {
  return Response.json({ error: DEMO_LIMIT_MESSAGE }, { status: 429 });
}

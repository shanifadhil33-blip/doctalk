import { describe, expect, it } from "vitest";
import { DEMO_LIMIT_MESSAGE, demoLimitMessage } from "@/lib/ai/limits";
import {
  DEMO_DAILY_QUESTION_CAP,
  clientIp,
  demoQuotaDeniedBody,
  demoQuotaKey,
  nextQuotaCount,
  utcDay,
} from "@/lib/demo/quota";

describe("demo question cap", () => {
  it("allows questions until the daily cap", () => {
    expect(nextQuotaCount(0)).toEqual({ allowed: true, count: 1 });
    expect(nextQuotaCount(DEMO_DAILY_QUESTION_CAP - 1)).toEqual({
      allowed: true,
      count: DEMO_DAILY_QUESTION_CAP,
    });
    expect(nextQuotaCount(DEMO_DAILY_QUESTION_CAP).allowed).toBe(false);
  });

  it("uses the same friendly limit message as a provider 429", () => {
    expect(demoQuotaDeniedBody()).toEqual({ error: DEMO_LIMIT_MESSAGE });
    expect(demoLimitMessage({ statusCode: 429 })).toBe(DEMO_LIMIT_MESSAGE);
    expect(demoLimitMessage({ status: 402 })).toBe(DEMO_LIMIT_MESSAGE);
  });

  it("builds a stable daily key from the client address", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.5, 10.0.0.1",
    });
    expect(clientIp(headers)).toBe("203.0.113.5");
    expect(demoQuotaKey(clientIp(headers), utcDay(new Date("2026-09-29T23:30:00.000Z")))).toBe(
      "demo_questions:2026-09-29:203.0.113.5",
    );
  });
});

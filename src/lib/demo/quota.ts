import { DEMO_LIMIT_MESSAGE } from "@/lib/ai/limits";

export const DEMO_DAILY_QUESTION_CAP = 20;

export function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 80);
  }
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 80);
  return "unknown";
}

export function demoQuotaKey(ip: string, day: string): string {
  const safeIp = ip.replace(/[^a-zA-Z0-9.:_-]/g, "_").slice(0, 80);
  return `demo_questions:${day}:${safeIp}`;
}

export function nextQuotaCount(
  used: number,
  cap = DEMO_DAILY_QUESTION_CAP,
): { allowed: boolean; count: number } {
  if (used >= cap) return { allowed: false, count: used };
  return { allowed: true, count: used + 1 };
}

export function demoQuotaDeniedBody(): { error: string } {
  return { error: DEMO_LIMIT_MESSAGE };
}

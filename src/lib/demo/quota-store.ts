import { getDb } from "@/db";
import {
  DEMO_DAILY_QUESTION_CAP,
  demoQuotaKey,
  utcDay,
} from "@/lib/demo/quota";
import { demoQuestionUpsertSql } from "@/lib/demo/quota-sql";
import type { QuotaIncrement } from "@/lib/limits/atomic-count";

export async function incrementDemoQuestionCount(
  key: string,
  cap: number,
): Promise<number | null> {
  const result = await getDb().execute<{ value: string }>(demoQuestionUpsertSql(key, cap));
  const raw = result.rows[0]?.value;
  if (!raw) return null;
  const count = Number.parseInt(raw, 10);
  return Number.isFinite(count) ? count : null;
}

/** Reserves one signed-out demo question for this UTC day. Fails closed on the cap. */
export async function takeDemoQuestionSlot(
  ip: string,
  now: Date,
  increment: QuotaIncrement = incrementDemoQuestionCount,
): Promise<boolean> {
  const count = await increment(demoQuotaKey(ip, utcDay(now)), DEMO_DAILY_QUESTION_CAP);
  return count !== null;
}

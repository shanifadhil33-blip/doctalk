import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { settings } from "@/db/schema";
import {
  DEMO_DAILY_QUESTION_CAP,
  demoQuotaKey,
  nextQuotaCount,
  utcDay,
} from "@/lib/demo/quota";

/** Reserves one signed-out demo question for this UTC day. Fails closed on the cap. */
export async function takeDemoQuestionSlot(ip: string, now: Date): Promise<boolean> {
  const key = demoQuotaKey(ip, utcDay(now));
  const db = getDb();
  const rows = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  const raw = rows[0]?.value;
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  const used = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  const next = nextQuotaCount(used, DEMO_DAILY_QUESTION_CAP);
  if (!next.allowed) return false;

  if (rows[0]) {
    await db.update(settings).set({ value: String(next.count) }).where(eq(settings.key, key));
    return true;
  }

  try {
    await db.insert(settings).values({ key, value: String(next.count) });
    return true;
  } catch {
    return false;
  }
}

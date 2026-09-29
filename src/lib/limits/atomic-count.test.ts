import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { DEMO_DAILY_QUESTION_CAP, demoQuotaKey, utcDay } from "@/lib/demo/quota";
import { takeDemoQuestionSlot } from "@/lib/demo/quota-store";
import { demoQuestionUpsertSql } from "@/lib/demo/quota-sql";
import { MAX_DOCUMENTS_PER_USER } from "@/lib/documents/upload-policy";
import { reserveDocumentSlotSql } from "@/lib/documents/reserve-slot";
import {
  applyDocumentRelease,
  createRowLockCounter,
  createSerializedReservations,
  nextAtomicCount,
  type SlotState,
} from "@/lib/limits/atomic-count";

const dialect = new PgDialect();

describe("nextAtomicCount", () => {
  it("starts at 1 and stops at the cap", () => {
    expect(nextAtomicCount(null, 5)).toBe(1);
    expect(nextAtomicCount(4, 5)).toBe(5);
    expect(nextAtomicCount(5, 5)).toBeNull();
    expect(nextAtomicCount(0, 20)).toBe(1);
    expect(nextAtomicCount(20, 20)).toBeNull();
  });
});

describe("signed-out IP counter", () => {
  it("uses one atomic upsert and never passes the daily cap in parallel", async () => {
    const query = dialect.sqlToQuery(
      demoQuestionUpsertSql("demo_questions:2026-09-29:203.0.113.5", DEMO_DAILY_QUESTION_CAP),
    );
    expect(query.sql).toContain("ON CONFLICT (key) DO UPDATE");
    expect(query.sql).toContain("RETURNING value");
    expect(query.params).toContain(DEMO_DAILY_QUESTION_CAP);

    const increment = createRowLockCounter();
    const now = new Date("2026-09-29T23:30:00.000Z");
    const results = await Promise.all(
      Array.from({ length: 40 }, () => takeDemoQuestionSlot("203.0.113.5", now, increment)),
    );
    expect(results.filter(Boolean)).toHaveLength(DEMO_DAILY_QUESTION_CAP);
    expect(demoQuotaKey("203.0.113.5", utcDay(now))).toBe(
      "demo_questions:2026-09-29:203.0.113.5",
    );

    const other = await Promise.all(
      Array.from({ length: 3 }, () => takeDemoQuestionSlot("198.51.100.9", now, increment)),
    );
    expect(other.every(Boolean)).toBe(true);
  });
});

describe("document slot reservation", () => {
  it("keeps parallel uploads at 5 and frees a slot on delete", async () => {
    const state: SlotState = { counts: new Map(), docs: [] };
    const reserve = createSerializedReservations(state);
    const input = {
      userId: "google-sub",
      cap: MAX_DOCUMENTS_PER_USER,
    };

    const results = await Promise.all(
      Array.from({ length: 12 }, (_, index) =>
        reserve({
          ...input,
          uploadId: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
          fileName: `file-${index}.pdf`,
        }),
      ),
    );

    const created = results.filter((result) => result.ok && result.created);
    expect(created).toHaveLength(MAX_DOCUMENTS_PER_USER);
    expect(results.filter((result) => !result.ok && result.reason === "limit")).toHaveLength(7);
    expect(state.docs).toHaveLength(MAX_DOCUMENTS_PER_USER);

    const first = created[0];
    if (!first || !first.ok) throw new Error("expected a reserved document");
    expect(applyDocumentRelease(state, "google-sub", first.documentId)).toBe(true);

    const again = await reserve({
      ...input,
      uploadId: "00000000-0000-4000-8000-000000000099",
      fileName: "again.pdf",
    });
    expect(again.ok).toBe(true);
    if (!again.ok) return;

    const repeat = await reserve({
      ...input,
      uploadId: "00000000-0000-4000-8000-000000000099",
      fileName: "again.pdf",
    });
    expect(repeat).toEqual({ ok: true, documentId: again.documentId, created: false });
    expect(state.docs.filter((doc) => doc.userId === "google-sub")).toHaveLength(
      MAX_DOCUMENTS_PER_USER,
    );
  });

  it("reserves with one conflict-upsert statement", () => {
    const query = dialect.sqlToQuery(
      reserveDocumentSlotSql({
        userId: "google-sub",
        fileName: "notes.pdf",
        pendingUrl: "pending:00000000-0000-4000-8000-000000000001",
        countKey: "doc_slots:google-sub",
        cap: MAX_DOCUMENTS_PER_USER,
      }),
    );
    expect(query.sql).toContain("ON CONFLICT (key) DO UPDATE");
    expect(query.sql).toContain("INSERT INTO documents");
    expect(query.sql).toContain("RETURNING id");
    expect(query.params).toContain(MAX_DOCUMENTS_PER_USER);
    expect(query.params).toContain("google-sub");
  });
});

import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { documents } from "@/db/schema";
import { isUploadId } from "@/lib/documents/blob-url";
import { PDF_LIMIT_MESSAGE, MAX_DOCUMENTS_PER_USER } from "@/lib/documents/upload-policy";
import { documentSlotKey, pendingFileUrl } from "@/lib/limits/atomic-count";

export function reserveDocumentSlotSql(input: {
  userId: string;
  fileName: string;
  pendingUrl: string;
  countKey: string;
  cap: number;
}) {
  return sql`
    WITH existing AS (
      SELECT id
      FROM documents
      WHERE user_id = ${input.userId}
        AND file_url = ${input.pendingUrl}
        AND is_demo = false
      LIMIT 1
    ),
    slot AS (
      INSERT INTO settings (key, value)
      SELECT ${input.countKey}, CAST(counts.cnt + 1 AS text)
      FROM (
        SELECT CAST(count(*) AS integer) AS cnt
        FROM documents
        WHERE user_id = ${input.userId}
          AND is_demo = false
      ) AS counts
      WHERE NOT EXISTS (SELECT 1 FROM existing)
        AND counts.cnt < ${input.cap}
      ON CONFLICT (key) DO UPDATE
      SET value = CAST(CAST(settings.value AS integer) + 1 AS text)
      WHERE NOT EXISTS (SELECT 1 FROM existing)
        AND settings.value ~ '^[0-9]+$'
        AND CAST(settings.value AS integer) < ${input.cap}
        AND (
          SELECT count(*)
          FROM documents
          WHERE user_id = ${input.userId}
            AND is_demo = false
        ) < ${input.cap}
      RETURNING value
    ),
    created AS (
      INSERT INTO documents (user_id, file_name, file_url, is_demo, status)
      SELECT ${input.userId}, ${input.fileName}, ${input.pendingUrl}, false, 'processing'
      WHERE EXISTS (SELECT 1 FROM slot)
        AND NOT EXISTS (SELECT 1 FROM existing)
      RETURNING id
    )
    SELECT created.id
    FROM created
    UNION ALL
    SELECT existing.id
    FROM existing
    WHERE NOT EXISTS (SELECT 1 FROM created)
  `;
}

export function deleteOwnedDocumentSql(input: {
  userId: string;
  documentId: string;
  countKey: string;
}) {
  return sql`
    WITH removed AS (
      DELETE FROM documents
      WHERE id = CAST(${input.documentId} AS uuid)
        AND user_id = ${input.userId}
        AND is_demo = false
      RETURNING id
    ),
    adjusted AS (
      UPDATE settings
      SET value = CAST(GREATEST(CAST(settings.value AS integer) - 1, 0) AS text)
      WHERE key = ${input.countKey}
        AND settings.value ~ '^[0-9]+$'
        AND EXISTS (SELECT 1 FROM removed)
      RETURNING key
    )
    SELECT removed.id
    FROM removed
    LEFT JOIN adjusted ON true
  `;
}

export function deletePendingUploadSql(input: {
  userId: string;
  pendingUrl: string;
  countKey: string;
}) {
  return sql`
    WITH removed AS (
      DELETE FROM documents
      WHERE user_id = ${input.userId}
        AND file_url = ${input.pendingUrl}
        AND is_demo = false
        AND status = 'processing'
      RETURNING id
    ),
    adjusted AS (
      UPDATE settings
      SET value = CAST(GREATEST(CAST(settings.value AS integer) - 1, 0) AS text)
      WHERE key = ${input.countKey}
        AND settings.value ~ '^[0-9]+$'
        AND EXISTS (SELECT 1 FROM removed)
      RETURNING key
    )
    SELECT removed.id
    FROM removed
    LEFT JOIN adjusted ON true
  `;
}

export async function reserveOwnedUpload(input: {
  userId: string;
  uploadId: string;
  fileName: string;
}): Promise<{ ok: true; documentId: string } | { ok: false; message: string }> {
  const pendingUrl = pendingFileUrl(input.uploadId);
  try {
    const result = await getDb().execute<{ id: string }>(
      reserveDocumentSlotSql({
        userId: input.userId,
        fileName: input.fileName,
        pendingUrl,
        countKey: documentSlotKey(input.userId),
        cap: MAX_DOCUMENTS_PER_USER,
      }),
    );
    const id = result.rows[0]?.id;
    if (!id) {
      return { ok: false, message: PDF_LIMIT_MESSAGE };
    }
    return { ok: true, documentId: id };
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const existing = await findPendingForUser(input.userId, pendingUrl);
    if (existing) return { ok: true, documentId: existing };
    return { ok: false, message: "That upload is already in use." };
  }
}

export async function deleteOwnedDocumentRow(
  userId: string,
  documentId: string,
): Promise<boolean> {
  const result = await getDb().execute<{ id: string }>(
    deleteOwnedDocumentSql({
      userId,
      documentId,
      countKey: documentSlotKey(userId),
    }),
  );
  return Boolean(result.rows[0]?.id);
}

export async function releasePendingUpload(
  userId: string,
  uploadId: string,
): Promise<boolean> {
  if (!isUploadId(uploadId)) return false;
  const result = await getDb().execute<{ id: string }>(
    deletePendingUploadSql({
      userId,
      pendingUrl: pendingFileUrl(uploadId),
      countKey: documentSlotKey(userId),
    }),
  );
  return Boolean(result.rows[0]?.id);
}

async function findPendingForUser(userId: string, pendingUrl: string): Promise<string | null> {
  const rows = await getDb()
    .select({ id: documents.id })
    .from(documents)
    .where(
      and(
        eq(documents.userId, userId),
        eq(documents.fileUrl, pendingUrl),
        eq(documents.isDemo, false),
      ),
    )
    .limit(1);
  return rows[0]?.id ?? null;
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && error.code === "23505") return true;
  if ("cause" in error && isUniqueViolation(error.cause)) return true;
  if ("message" in error && typeof error.message === "string") {
    return error.message.includes("duplicate key") || error.message.includes("23505");
  }
  return false;
}

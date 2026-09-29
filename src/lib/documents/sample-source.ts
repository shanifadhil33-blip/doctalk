import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { documents } from "@/db/schema";

/** Offline demo route. It only exists when the app is running without a database. */
export const OFFLINE_SAMPLE_SOURCE_HREF =
  "/documents/master-services-agreement?page=3";

/** Seeded public sample. Its id is a database uuid, not the offline slug. */
export const SEEDED_SAMPLE_AGREEMENT_FILE = "Sample_Services_Agreement.pdf";

export function resolveSampleSourceHref(
  databaseConfigured: boolean,
  demoDocumentId: string | null,
): string {
  if (!databaseConfigured) return OFFLINE_SAMPLE_SOURCE_HREF;
  if (!demoDocumentId) return "/documents";
  return `/documents/${demoDocumentId}?page=3`;
}

export async function sampleSourceHref(): Promise<string> {
  if (!process.env.DATABASE_URL) {
    return resolveSampleSourceHref(false, null);
  }

  try {
    const rows = await getDb()
      .select({ id: documents.id })
      .from(documents)
      .where(
        and(
          eq(documents.isDemo, true),
          eq(documents.fileName, SEEDED_SAMPLE_AGREEMENT_FILE),
        ),
      )
      .limit(1);
    return resolveSampleSourceHref(true, rows[0]?.id ?? null);
  } catch {
    console.error("Could not resolve the sample source link");
    return resolveSampleSourceHref(true, null);
  }
}

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { documents } from "@/db/schema";
import type { DocumentLookup } from "@/lib/auth/access";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function lookupDocument(
  documentId: string,
): Promise<DocumentLookup> {
  if (!UUID_PATTERN.test(documentId)) {
    return { status: "missing" };
  }

  if (!process.env.DATABASE_URL) {
    return { status: "unavailable" };
  }

  try {
    const rows = await getDb()
      .select({
        userId: documents.userId,
        isDemo: documents.isDemo,
        fileName: documents.fileName,
      })
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);
    const row = rows[0];
    if (!row) {
      return { status: "missing" };
    }
    return { status: "found", document: row };
  } catch {
    console.error("Document lookup failed");
    return { status: "unavailable" };
  }
}

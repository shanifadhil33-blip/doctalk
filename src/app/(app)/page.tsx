import Link from "next/link";
import { desc } from "drizzle-orm";
import { auth } from "@/auth";
import { userIdFromTokenSub } from "@/lib/auth/user-id";
import { getDb } from "@/db";
import { documents } from "@/db/schema";
import { visibleDocumentsWhere } from "@/lib/documents/visibility";

export const dynamic = "force-dynamic";

function formatUploadDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = userIdFromTokenSub(session?.user?.id);
  const docs = await getDb()
    .select()
    .from(documents)
    .where(visibleDocumentsWhere(userId))
    .orderBy(desc(documents.createdAt));

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Your Documents
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Grounded extractions from invoices, contracts, and statements.
          </p>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Upload Document
        </Link>
      </header>

      {docs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <h2 className="text-base font-medium text-slate-900">
            No documents yet
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
            Upload your first PDF to extract structured, evidence-backed JSON.
          </p>
          <Link
            href="/upload"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Upload Document
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <li key={doc.id}>
              <Link
                href={`/documents/${doc.id}`}
                className="block h-full rounded-lg border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-sm font-medium leading-snug text-slate-900">
                    {doc.fileName}
                  </h2>
                  {doc.isDemo ? (
                    <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                      Demo
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Uploaded {formatUploadDate(doc.createdAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

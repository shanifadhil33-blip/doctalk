import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { decideDocumentAccess, safeCallbackPath } from "@/lib/auth/access";
import { userIdFromTokenSub } from "@/lib/auth/user-id";
import { lookupDocument } from "@/lib/documents/lookup";

export const dynamic = "force-dynamic";

type DocumentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
  const { id } = await params;
  const session = await auth();
  const viewerUserId = userIdFromTokenSub(session?.user?.id);
  const lookup = await lookupDocument(id);
  const decision = decideDocumentAccess(viewerUserId, lookup);

  if (decision === "sign-in") {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(safeCallbackPath(`/documents/${id}`))}`);
  }

  if (decision !== "allow" || lookup.status !== "found") {
    notFound();
  }

  return (
    <div>
      <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
        ← Back to Dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        {lookup.document.fileName}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Document ID: <span className="font-mono text-slate-800">{id}</span>
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          PDF viewer placeholder
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Extracted JSON placeholder
        </div>
      </div>
    </div>
  );
}

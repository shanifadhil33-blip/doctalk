import Link from "next/link";

type DocumentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
  const { id } = await params;

  return (
    <div>
      <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
        ← Back to Dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Document Detail
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

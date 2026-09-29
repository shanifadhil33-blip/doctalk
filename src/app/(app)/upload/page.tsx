import Link from "next/link";

export default function UploadPage() {
  return (
    <div>
      <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
        ← Back to Dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Upload</h1>
      <p className="mt-1 text-sm text-slate-600">
        Drag and drop a PDF to process it.
      </p>
      <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
        Dropzone placeholder. File storage and the processing pipeline come later.
      </div>
    </div>
  );
}

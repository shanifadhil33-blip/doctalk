import Link from "next/link";
import { textLinkClass } from "@/components/button-styles";
import { ChevronLeftGlyph } from "@/components/icons";

export function DocumentHeading({
  title,
  meta,
}: {
  title: string;
  meta?: string;
}) {
  return (
    <div className="flex min-w-0 max-w-full items-center gap-2 text-sm">
      <Link href="/documents" className={`${textLinkClass} shrink-0 text-sm`}>
        <ChevronLeftGlyph className="h-4 w-4" />
        Documents
      </Link>
      <span className="text-slate-300" aria-hidden="true">
        /
      </span>
      <h1 className="min-w-0 truncate font-medium text-slate-950">{title}</h1>
      {meta ? (
        <span className="hidden shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 sm:inline">
          {meta}
        </span>
      ) : null}
    </div>
  );
}

import Link from "next/link";
import { controlFocusClass } from "@/components/button-styles";
import { DocumentGlyph } from "@/components/icons";

export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link
      href={href}
      prefetch={true}
      aria-label="DocTalk"
      className={[
        "inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-[15px] font-semibold tracking-tight text-slate-950",
        "transition-colors duration-150 ease-out motion-reduce:transition-none",
        "hover:bg-slate-100 active:bg-slate-200",
        controlFocusClass,
      ].join(" ")}
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#4f46e5] text-white">
        <DocumentGlyph className="h-4 w-4" />
      </span>
      <span className={compact ? "max-sm:sr-only" : undefined}>DocTalk</span>
    </Link>
  );
}

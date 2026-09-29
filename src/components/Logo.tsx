import Link from "next/link";
import { DocumentGlyph } from "@/components/icons";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-md text-[15px] font-semibold tracking-tight text-slate-950"
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#4f46e5] text-white">
        <DocumentGlyph className="h-4 w-4" />
      </span>
      DocTalk
    </Link>
  );
}

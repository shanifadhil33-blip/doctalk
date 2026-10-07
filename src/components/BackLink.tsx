import Link from "next/link";
import { textLinkClass } from "@/components/button-styles";
import { ChevronLeftGlyph } from "@/components/icons";

export function BackLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      prefetch={true}
      scroll={false}
      data-scroll="false"
      className={`${textLinkClass} shrink-0 whitespace-nowrap px-2 text-sm`}
    >
      <ChevronLeftGlyph className="h-4 w-4" />
      {children}
    </Link>
  );
}

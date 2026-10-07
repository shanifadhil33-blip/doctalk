import Link from "next/link";
import { primaryButtonClass, secondaryButtonClass } from "@/components/button-styles";
import { Logo } from "@/components/Logo";
import { SiteFooter } from "@/components/SiteFooter";
import { SkipLink } from "@/components/SkipLink";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh min-w-0 max-w-full flex-col overflow-x-hidden bg-[#f5f6f8]">
      <SkipLink />
      <header className="border-b border-slate-200 bg-white px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
        <Logo />
      </header>
      <main id="main" className="mx-auto flex w-full min-w-0 max-w-lg flex-1 flex-col justify-center px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Page not found</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          That link does not match a page in DocTalk.
        </p>
        <div className="mt-6 flex flex-col items-stretch gap-2 sm:items-center">
          <Link href="/" className={`${primaryButtonClass} sm:min-w-44`}>
            Back to home
          </Link>
          <Link href="/documents" className={`${secondaryButtonClass} sm:min-w-44`}>
            Browse documents
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

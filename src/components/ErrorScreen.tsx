"use client";

import Link from "next/link";
import { BackLink } from "@/components/BackLink";
import { primaryButtonClass, secondaryButtonClass, textButtonClass } from "@/components/button-styles";
import { SiteFooter } from "@/components/SiteFooter";
import { SkipLink } from "@/components/SkipLink";
import { TopBar } from "@/components/TopBar";

export function ErrorScreen({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-dvh min-w-0 max-w-full flex-col overflow-x-hidden bg-[#f5f6f8]">
      <SkipLink />
      <TopBar
        back={<BackLink href="/">Home</BackLink>}
        actions={
          <>
            <Link href="/documents" prefetch={true} className={textButtonClass}>
              Documents
            </Link>
            <Link href="/settings" prefetch={true} className={textButtonClass}>
              Settings
            </Link>
          </>
        }
      />
      <main id="main" className="mx-auto flex w-full min-w-0 max-w-lg flex-1 flex-col justify-center px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Something went wrong</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          This page didn&apos;t load. You can try again, or go back home.
        </p>
        <div className="mt-6 flex flex-col items-stretch gap-2 sm:items-center">
          <button type="button" className={`${primaryButtonClass} sm:min-w-44`} onClick={() => reset()}>
            Try again
          </button>
          <Link href="/" prefetch={true} className={`${secondaryButtonClass} sm:min-w-44`}>
            Home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

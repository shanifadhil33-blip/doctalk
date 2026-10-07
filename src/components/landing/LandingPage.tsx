import type { ReactNode } from "react";
import Link from "next/link";
import { MessageGlyph, SearchGlyph, UploadGlyph } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { primaryButtonClass } from "@/components/button-styles";
import { SiteFooter } from "@/components/SiteFooter";
import { SkipLink } from "@/components/SkipLink";
import { citationChipClass } from "@/components/workspace/CitationChip";

const features = [
  {
    title: "Upload a PDF",
    body: "Drop in a contract, invoice, or statement.",
    icon: UploadGlyph,
  },
  {
    title: "Ask in plain words",
    body: "Type a question the way you would ask a colleague.",
    icon: MessageGlyph,
  },
  {
    title: "Check the source",
    body: "Every answer links to the page and passage it used.",
    icon: SearchGlyph,
  },
] as const;

export function LandingPage({
  demoHref,
  sourceHref,
  headerAccount,
  heroAccount,
}: {
  demoHref: string;
  sourceHref: string;
  headerAccount: ReactNode;
  heroAccount?: ReactNode;
}) {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#eceef2] sm:p-4 md:p-6">
      <SkipLink />
      <div className="mx-auto flex min-h-dvh max-w-[1180px] flex-col overflow-x-hidden bg-white sm:min-h-[calc(100dvh-3rem)] sm:rounded-[28px] sm:shadow-[0_16px_50px_rgba(15,23,42,0.08)] sm:ring-1 sm:ring-slate-200">
        <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
          <Logo />
          <div className="flex items-center gap-2">
            {headerAccount}
            <Link href={demoHref} className={primaryButtonClass}>
              Try the demo
            </Link>
          </div>
        </header>

        <main id="main" className="flex-1 px-4 pb-8 sm:px-8">
          <div className="grid items-center gap-10 py-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:py-10">
            <div>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl sm:leading-[1.08]">
                Ask a PDF a question. See the page it came from.
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-slate-600">
                DocTalk answers questions about your documents and highlights the exact passage behind every answer.
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Link href={demoHref} className={primaryButtonClass}>
                  Try the demo
                </Link>
                {heroAccount}
              </div>
            </div>
            <ProductPreview sourceHref={sourceHref} />
          </div>

          <ul className="grid gap-4 border-t border-slate-200 pt-8 md:grid-cols-3">
            {features.map((feature) => (
              <li
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-[#f8f9fb] p-5"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700">
                  <feature.icon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-base font-semibold text-slate-950">
                  {feature.title}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  {feature.body}
                </p>
              </li>
            ))}
          </ul>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}

function ProductPreview({ sourceHref }: { sourceHref: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#f7f8fa] shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
        </span>
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
          Master-Services-Agreement.pdf
        </p>
        <p className="ml-auto shrink-0 text-xs text-slate-500">Page 3 of 11</p>
      </div>
      <div className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(220px,0.85fr)]">
        <article className="rounded-xl border border-slate-200 bg-white p-4 text-[13px] leading-relaxed text-slate-800">
          <p className="flex justify-between gap-3 text-[10px] font-medium uppercase tracking-wide text-slate-400">
            <span>Master Services Agreement</span>
            <span>Page 3</span>
          </p>
          <h2 className="mt-3 text-sm font-semibold text-slate-950">
            Section 4: Term and termination
          </h2>
          <p className="mt-3 text-slate-600">
            <span className="font-medium text-slate-800">4.1 Initial term. </span>
            This Agreement commences on the Effective Date and continues for twenty-four (24) months.
          </p>
          <div className="mt-3 rounded-lg border border-[#c7c9f5] bg-[#f5f4ff] p-3">
            <p className="text-[11px] font-medium text-[#3730a3]">
              4.2 Termination for convenience
            </p>
            <p className="mt-1">
              Either party may terminate this Agreement without cause upon giving at least sixty (60) days prior written notice to the other party. In the event of a material breach...
            </p>
          </div>
          <p className="mt-3 text-slate-500">
            4.3 Termination for cause. If either party fails to perform any of its material obligations under this Agreement...
          </p>
        </article>
        <aside className="flex flex-col rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Inquiry
          </p>
          <div className="mt-3 self-end rounded-2xl rounded-br-md bg-slate-100 px-3 py-2 text-sm text-slate-800">
            <p className="text-[11px] text-slate-500">Question</p>
            What is the notice period for termination?
          </div>
          <div className="mt-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-800">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Answer
            </p>
            <p className="mt-1">Either party can terminate with 60 days written notice.</p>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-500">Source</span>
              <Link href={sourceHref} className={citationChipClass(true)}>
                Source p. 3
              </Link>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400">
            <span className="flex-1">Ask a question...</span>
            <span className="grid h-7 w-7 place-items-center rounded-md bg-[#4f46e5] text-white" aria-hidden="true">
              <Chevron />
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

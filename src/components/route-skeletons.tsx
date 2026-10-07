"use client";

import { Logo } from "@/components/Logo";
import { SiteFooter } from "@/components/SiteFooter";
import { SkipLink } from "@/components/SkipLink";
import { TopBar } from "@/components/TopBar";
import { useRestoreListScroll } from "@/components/list-scroll";

function Bone({ className }: { className: string }) {
  return <span className={`block animate-pulse rounded-md bg-slate-200 ${className}`} />;
}

export function DocumentsLoading() {
  useRestoreListScroll("documents", false);
  return (
    <div className="flex min-h-dvh min-w-0 max-w-full flex-col overflow-x-hidden bg-[#f5f6f8]" aria-busy="true">
      <SkipLink />
      <TopBar
        back={<Bone className="h-11 w-24" />}
        actions={
          <>
            <Bone className="h-11 w-24" />
            <Bone className="h-11 w-11" />
          </>
        }
      />
      <main id="main" className="site-main mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Documents</h1>
        <Bone className="mt-3 h-5 w-72 max-w-full" />
        <Bone className="mt-6 h-11 w-full" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {["one", "two", "three"].map((key) => (
            <div key={key} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <Bone className="h-[210px] rounded-none" />
              <div className="space-y-2 p-4">
                <Bone className="h-4 w-24" />
                <Bone className="h-6 w-3/4" />
                <Bone className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function DocumentLoading() {
  return (
    <div className="flex min-h-dvh w-full min-w-0 max-w-full flex-col overflow-x-hidden bg-[#f5f6f8] lg:h-dvh lg:overflow-hidden" aria-busy="true">
      <SkipLink />
      <TopBar
        back={<Bone className="h-11 w-28" />}
        actions={
          <>
            <Bone className="h-11 w-11" />
            <Bone className="h-11 w-24" />
          </>
        }
      />
      <main id="main" className="site-main flex w-full min-w-0 max-w-full flex-col lg:min-h-0 lg:flex-1 lg:flex-row lg:overflow-hidden">
        <div className="h-[50dvh] max-h-[50dvh] w-full shrink-0 bg-[#eef0f3] lg:h-full lg:max-h-none lg:flex-1" />
        <aside className="flex h-[85dvh] max-h-[85dvh] w-full shrink-0 flex-col border-t border-slate-200 bg-white lg:h-full lg:max-h-none lg:w-[420px] lg:border-l lg:border-t-0">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-950">Ask this document</h2>
            <Bone className="mt-2 h-4 w-24" />
          </div>
          <div className="min-h-0 flex-1 px-4 py-4">
            <Bone className="h-16 w-4/5" />
          </div>
          <div className="border-t border-slate-200 p-4">
            <Bone className="h-16 w-full" />
          </div>
        </aside>
      </main>
      <div className="h-24 shrink-0 lg:hidden" aria-hidden="true" />
      <SiteFooter />
    </div>
  );
}

export function HomeLoading({ signedIn }: { signedIn: boolean }) {
  if (!signedIn) {
    return (
      <div className="min-h-dvh overflow-x-hidden bg-[#eceef2] sm:p-4 md:p-6" aria-busy="true">
        <SkipLink />
        <div className="mx-auto flex min-h-dvh max-w-[1180px] flex-col overflow-x-hidden bg-white sm:min-h-[calc(100dvh-3rem)] sm:rounded-[28px] sm:shadow-[0_16px_50px_rgba(15,23,42,0.08)] sm:ring-1 sm:ring-slate-200">
          <header className="site-header flex flex-wrap items-center justify-between gap-2 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
            <Logo />
            <Bone className="h-11 w-32" />
          </header>
          <main id="main" className="site-main flex-1 px-4 pb-8 sm:px-8">
            <Bone className="mt-6 h-10 w-full max-w-xl" />
            <Bone className="mt-3 h-10 w-4/5 max-w-md" />
            <Bone className="mt-6 h-11 w-36" />
            <Bone className="mt-8 h-64 w-full" />
          </main>
          <SiteFooter />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh min-w-0 max-w-full flex-col overflow-x-hidden bg-[#f5f6f8]" aria-busy="true">
      <SkipLink />
      <TopBar actions={<Bone className="h-11 w-24" />} />
      <main id="main" className="site-main mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Your documents</h1>
        <Bone className="mt-6 h-40 w-full" />
        <Bone className="mt-10 h-6 w-40" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Bone className="h-[280px]" />
          <Bone className="h-[280px]" />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function SettingsLoading() {
  return (
    <div className="flex min-h-dvh min-w-0 max-w-full flex-col overflow-x-hidden bg-[#f5f6f8]" aria-busy="true">
      <SkipLink />
      <TopBar back={<Bone className="h-11 w-24" />} actions={<Bone className="h-11 w-11" />} />
      <main id="main" className="site-main mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Settings</h1>
        <Bone className="mt-8 h-40 w-full" />
      </main>
      <SiteFooter />
    </div>
  );
}

export function SignInLoading() {
  return (
    <div className="flex min-h-dvh min-w-0 max-w-full flex-col overflow-x-hidden bg-[#f5f6f8]" aria-busy="true">
      <SkipLink />
      <TopBar back={<Bone className="h-11 w-24" />} actions={<Bone className="h-11 w-28" />} />
      <main id="main" className="site-main flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Sign in</h1>
          <Bone className="mt-6 h-11 w-full" />
          <Bone className="mt-2 h-11 w-full" />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function NotFoundLoading() {
  return (
    <div className="flex min-h-dvh min-w-0 max-w-full flex-col overflow-x-hidden bg-[#f5f6f8]" aria-busy="true">
      <SkipLink />
      <TopBar back={<Bone className="h-11 w-24" />} actions={<Bone className="h-11 w-28" />} />
      <main id="main" className="site-main mx-auto flex w-full min-w-0 max-w-lg flex-1 flex-col justify-center px-4 py-16">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-slate-950">Page not found</h1>
        <Bone className="mx-auto mt-6 h-11 w-44" />
      </main>
      <SiteFooter />
    </div>
  );
}

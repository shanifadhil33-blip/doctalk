import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

export function TopBar({
  back,
  title,
  meta,
  actions,
}: {
  back?: ReactNode;
  title?: string;
  meta?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="site-header flex w-full min-w-0 max-w-full flex-wrap items-center gap-x-1 gap-y-1 overflow-x-hidden border-b border-slate-200 bg-white px-2 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-4 sm:pb-3 sm:pt-[max(0.75rem,env(safe-area-inset-top))]">
      {back ? <div className="order-1 shrink-0">{back}</div> : null}
      <div className="order-2 shrink-0">
        <Logo compact={Boolean(back)} />
      </div>
      {title ? (
        <h1 className="order-4 flex min-w-0 basis-full items-center gap-2 text-sm font-medium text-slate-950 sm:order-3 sm:basis-auto sm:flex-1">
          <span className="min-w-0 break-words sm:truncate">{title}</span>
          {meta ? (
            <span className="hidden shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 sm:inline">
              {meta}
            </span>
          ) : null}
        </h1>
      ) : null}
      {actions ? (
        <div className="order-3 ml-auto flex shrink-0 items-center gap-1 sm:order-4 sm:gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

export function TopBar({
  leading,
  actions,
}: {
  leading?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex w-full min-w-0 max-w-full flex-wrap items-center gap-x-3 gap-y-2 overflow-x-hidden border-b border-slate-200 bg-white px-3 py-3 sm:px-6">
      <div className="flex min-w-0 w-full max-w-full flex-1 basis-full items-center gap-2 sm:basis-auto sm:w-auto">
        <Logo />
        {leading}
      </div>
      {actions ? (
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

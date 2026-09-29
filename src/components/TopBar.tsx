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
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <Logo />
        {leading}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

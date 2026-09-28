import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-slate-900"
        >
          DocTalk
        </Link>
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-4 text-sm text-slate-600">
            <Link href="/" className="hover:text-slate-900">
              Dashboard
            </Link>
            <Link href="/upload" className="hover:text-slate-900">
              Upload
            </Link>
          </nav>
          <Show when="signed-in">
            <UserButton />
          </Show>
          <Show when="signed-out">
            <Link href="/sign-in" className="text-sm font-medium text-slate-900">
              Sign in
            </Link>
          </Show>
        </div>
      </div>
    </header>
  );
}

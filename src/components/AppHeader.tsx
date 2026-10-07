import Link from "next/link";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/SignOutButton";
import { signInWithGoogle } from "@/lib/auth/actions";
import { userIdFromTokenSub } from "@/lib/auth/user-id";

export default async function AppHeader() {
  const session = await auth();
  const signedIn = userIdFromTokenSub(session?.user?.id) !== null;
  const name = session?.user?.name;

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
          {signedIn ? (
            <div className="flex items-center gap-3">
              {name ? (
                <span className="text-sm text-slate-600">{name}</span>
              ) : (
                <span className="text-sm text-slate-600">Signed in</span>
              )}
              <SignOutButton />
            </div>
          ) : (
            <form action={signInWithGoogle}>
              <input type="hidden" name="redirectTo" value="/" />
              <button type="submit" className="text-sm font-medium text-slate-900">
                Sign in
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}

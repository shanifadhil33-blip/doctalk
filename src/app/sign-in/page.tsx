import Link from "next/link";
import { signIn } from "@/auth";
import { secondaryButtonClass } from "@/components/button-styles";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { Logo } from "@/components/Logo";
import { SiteFooter } from "@/components/SiteFooter";
import { SkipLink } from "@/components/SkipLink";
import { safeCallbackPath } from "@/lib/auth/access";

type SignInPageProps = {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const rawCallback = Array.isArray(params.callbackUrl)
    ? params.callbackUrl[0]
    : params.callbackUrl;
  const callbackPath = safeCallbackPath(rawCallback);

  return (
    <div className="flex min-h-dvh min-w-0 max-w-full flex-col overflow-x-hidden bg-[#f5f6f8]">
      <SkipLink />
      <header className="px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
        <Logo />
      </header>
      <main id="main" className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Sign in</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Sign in with Google to upload documents. Sample documents stay open without an account.
          </p>
          <form
            className="mt-6"
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: callbackPath });
            }}
          >
            <GoogleSignInButton type="submit" className="w-full" />
          </form>
          <Link href="/documents" className={`${secondaryButtonClass} mt-2 w-full`}>
            Try the demo
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

import { signIn } from "@/auth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            DocTalk
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in with Google to view the demo.
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: callbackPath });
          }}
        >
          <GoogleSignInButton type="submit" className="w-full" />
        </form>
      </div>
    </div>
  );
}

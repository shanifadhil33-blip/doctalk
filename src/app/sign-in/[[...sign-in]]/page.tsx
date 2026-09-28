import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            DocTalk
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in with Google to view the demo.
          </p>
        </div>
        <SignIn
          routing="path"
          path="/sign-in"
          fallbackRedirectUrl="/"
          forceRedirectUrl="/"
        />
      </div>
    </div>
  );
}

import Link from "next/link";
import { auth } from "@/auth";
import { textButtonClass } from "@/components/button-styles";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { safeCallbackPath } from "@/lib/auth/access";
import { signInWithGoogle, signOutToHome } from "@/lib/auth/actions";
import { userIdFromTokenSub } from "@/lib/auth/user-id";

export async function AccountMenu({
  variant = "text",
  redirectTo = "/",
  showSettings = true,
}: {
  variant?: "google" | "text";
  redirectTo?: string;
  showSettings?: boolean;
}) {
  const session = await auth();
  const signedIn = userIdFromTokenSub(session?.user?.id) !== null;
  const destination = safeCallbackPath(redirectTo);

  if (signedIn) {
    if (variant === "google") {
      return null;
    }

    const name = session?.user?.name?.trim() || "Signed in";

    return (
      <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
        <span className="max-w-[10rem] min-w-0 truncate px-2 text-sm text-slate-600" aria-label={name}>
          {name}
        </span>
        {showSettings ? (
          <Link href="/settings" className={textButtonClass}>
            Settings
          </Link>
        ) : null}
        <form action={signOutToHome}>
          <button type="submit" className={textButtonClass}>
            Sign out
          </button>
        </form>
      </div>
    );
  }

  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="redirectTo" value={destination} />
      <GoogleSignInButton type="submit" variant={variant} />
    </form>
  );
}

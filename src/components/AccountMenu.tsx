import { auth } from "@/auth";
import { textButtonClass } from "@/components/button-styles";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { safeCallbackPath } from "@/lib/auth/access";
import { signInWithGoogle, signOutToHome } from "@/lib/auth/actions";
import { userIdFromTokenSub } from "@/lib/auth/user-id";

export async function AccountMenu({
  variant = "text",
  redirectTo = "/",
}: {
  variant?: "google" | "text";
  redirectTo?: string;
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
      <form action={signOutToHome} className="flex max-w-full items-center gap-2">
        <span className="max-w-[10rem] truncate text-sm text-slate-600" title={name}>
          {name}
        </span>
        <button
          type="submit"
          className={textButtonClass}
        >
          Sign out
        </button>
      </form>
    );
  }

  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="redirectTo" value={destination} />
      <GoogleSignInButton type="submit" variant={variant} />
    </form>
  );
}

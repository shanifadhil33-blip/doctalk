import { auth } from "@/auth";
import { AccountControls } from "@/components/AccountControls";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { safeCallbackPath } from "@/lib/auth/access";
import { signInWithGoogle } from "@/lib/auth/actions";
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
      <AccountControls
        name={name}
        email={session?.user?.email?.trim() || null}
        showSettings={showSettings}
      />
    );
  }

  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="redirectTo" value={destination} />
      <GoogleSignInButton type="submit" variant={variant} />
    </form>
  );
}

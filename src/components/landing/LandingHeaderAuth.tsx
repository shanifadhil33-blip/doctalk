import { primaryButtonClass } from "@/components/button-styles";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { signInWithGoogle } from "@/lib/auth/actions";

/** Signed-out landing header: quiet Sign in, filled Sign up. Both start Google sign-in. */
export function LandingHeaderAuth() {
  return (
    <form action={signInWithGoogle} className="flex shrink-0 flex-nowrap items-center gap-1">
      <input type="hidden" name="redirectTo" value="/" />
      <GoogleSignInButton type="submit" variant="text" className="whitespace-nowrap">
        Sign in
      </GoogleSignInButton>
      <button type="submit" className={`${primaryButtonClass} whitespace-nowrap`}>
        Sign up
      </button>
    </form>
  );
}

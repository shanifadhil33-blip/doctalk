import { primaryButtonClass } from "@/components/button-styles";
import { signInWithGoogle } from "@/lib/auth/actions";

/** Signed-out landing header: one filled Sign in. It starts Google sign-in. */
export function LandingHeaderAuth() {
  return (
    <form action={signInWithGoogle} className="flex shrink-0 flex-nowrap items-center">
      <input type="hidden" name="redirectTo" value="/" />
      <button type="submit" className={`${primaryButtonClass} whitespace-nowrap`}>
        Sign in
      </button>
    </form>
  );
}

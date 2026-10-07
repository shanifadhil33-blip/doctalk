import { signOut } from "@/auth";
import { isNextRedirect } from "@/lib/auth/redirect-error";

/** Clears the Auth.js session cookie and does not call `redirect()`. */
export async function clearSession(): Promise<void> {
  try {
    await signOut({ redirect: false, redirectTo: "/" });
  } catch (error: unknown) {
    if (isNextRedirect(error)) return;
    throw error;
  }
}

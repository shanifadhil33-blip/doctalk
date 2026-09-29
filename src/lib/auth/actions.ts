"use server";

import { signIn, signOut } from "@/auth";
import { safeCallbackPath } from "@/lib/auth/access";

export async function signInWithGoogle(formData: FormData) {
  const raw = formData.get("redirectTo");
  const redirectTo = safeCallbackPath(typeof raw === "string" ? raw : undefined);
  await signIn("google", { redirectTo });
}

export async function signOutToHome() {
  await signOut({ redirectTo: "/" });
}

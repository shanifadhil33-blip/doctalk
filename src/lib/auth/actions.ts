"use server";

import { signIn } from "@/auth";
import { safeCallbackPath } from "@/lib/auth/access";

export async function signInWithGoogle(formData: FormData) {
  const raw = formData.get("redirectTo");
  const redirectTo = safeCallbackPath(typeof raw === "string" ? raw : undefined);
  await signIn("google", { redirectTo });
}

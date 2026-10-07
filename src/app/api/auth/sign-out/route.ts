import { clearSession } from "@/lib/auth/clear-session";
import { isSameOriginRequest } from "@/lib/auth/same-origin";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ ok: false }, { status: 403 });
  }

  try {
    await clearSession();
  } catch (error: unknown) {
    console.error("Sign out failed", error instanceof Error ? error.message : "unknown");
    return Response.json({ ok: false }, { status: 500 });
  }

  return Response.json({ ok: true });
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { auth } from "@/auth";
import { SessionFlag } from "@/components/session-flag";
import { userIdFromTokenSub } from "@/lib/auth/user-id";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  description: "Ask a PDF a question and see the page the answer came from.",
};

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const signedIn = userIdFromTokenSub(session?.user?.id) !== null;
  return <SessionFlag signedIn={signedIn}>{children}</SessionFlag>;
}

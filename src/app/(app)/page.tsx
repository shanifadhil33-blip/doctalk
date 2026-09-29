import type { Metadata } from "next";
import { auth } from "@/auth";
import { AccountMenu } from "@/components/AccountMenu";
import { LandingPage } from "@/components/landing/LandingPage";
import { userIdFromTokenSub } from "@/lib/auth/user-id";

export const metadata: Metadata = {
  title: "DocTalk",
  description: "Ask a PDF a question and see the page the answer came from.",
};

export default async function HomePage() {
  const session = await auth();
  const signedIn = userIdFromTokenSub(session?.user?.id) !== null;

  return (
    <LandingPage
      demoHref="/documents"
      headerAccount={<AccountMenu variant="text" redirectTo="/" />}
      heroAccount={
        signedIn ? null : <AccountMenu variant="google" redirectTo="/documents" />
      }
    />
  );
}

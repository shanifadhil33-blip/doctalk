import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccountMenu } from "@/components/AccountMenu";
import { SiteFooter } from "@/components/SiteFooter";
import { SkipLink } from "@/components/SkipLink";
import { TopBar } from "@/components/TopBar";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { signOutToHome } from "@/lib/auth/actions";
import { userIdFromTokenSub } from "@/lib/auth/user-id";

export const metadata: Metadata = {
  title: "Settings | DocTalk",
};

export default async function SettingsPage() {
  const session = await auth();
  const viewerUserId = userIdFromTokenSub(session?.user?.id);
  if (!viewerUserId) {
    redirect("/sign-in?callbackUrl=%2Fsettings");
  }

  const name = session?.user?.name?.trim() || "Signed in";
  const email = session?.user?.email?.trim() || null;

  return (
    <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden bg-[#f5f6f8]">
      <SkipLink />
      <TopBar actions={<AccountMenu variant="text" redirectTo="/settings" showSettings={false} />} />
      <main id="main" className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <AccountSettings name={name} email={email} signOutAction={signOutToHome} />
      </main>
      <SiteFooter />
    </div>
  );
}

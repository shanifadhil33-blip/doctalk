"use client";

import { AccountControls } from "@/components/AccountControls";
import { SignedInHome } from "@/components/home/SignedInHome";
import { DocumentsDashboard } from "@/components/documents/DocumentsDashboard";
import { SettingsBack } from "@/components/SettingsBack";
import { SiteFooter } from "@/components/SiteFooter";
import { SkipLink } from "@/components/SkipLink";
import { TopBar } from "@/components/TopBar";
import { AccountSettings } from "@/components/settings/AccountSettings";
import type { ListedDocument } from "@/lib/document-types";

const previewName = "Adhil Shanif";
const previewEmail = "adhil@example.com";

function previewAccount(showSettings = true) {
  return (
    <AccountControls
      name={previewName}
      email={previewEmail}
      showSettings={showSettings}
      signOutAction={async () => {
        await new Promise<void>(() => undefined);
      }}
    />
  );
}

const demoDocument: ListedDocument = {
  id: "master-services-agreement",
  title: "Master Services Agreement",
  counterparty: "Sample",
  kindLabel: "PDF",
  meta: "Added Jan 1",
  status: "Sample",
  preview: "contract",
  fileName: "Master-Services-Agreement.pdf",
  addedOn: "2026-01-01",
  pageCount: 11,
};

export function SignedInPreview({ view }: { view: "home" | "documents" | "demo" | "settings" }) {
  if (view === "settings") {
    return (
      <div className="flex min-h-dvh min-w-0 max-w-full flex-col overflow-x-hidden bg-[#f5f6f8]">
        <SkipLink />
        <TopBar back={<SettingsBack />} actions={previewAccount(false)} />
        <main id="main" className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 py-8 sm:px-6">
          <AccountSettings name={previewName} email={previewEmail} signOutAction={async () => undefined} />
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (view === "demo") {
    return (
      <DocumentsDashboard
        documents={[demoDocument]}
        source="demo"
        signedIn
        headerAccount={previewAccount()}
      />
    );
  }

  // Signed-in /documents redirects here, so both preview routes show this screen.
  return (
    <SignedInHome
      source="library"
      owned={[]}
      questions={[]}
      headerAccount={previewAccount()}
    />
  );
}

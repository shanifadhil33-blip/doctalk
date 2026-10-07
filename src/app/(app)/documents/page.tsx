import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccountMenu } from "@/components/AccountMenu";
import { DocumentsDashboard } from "@/components/documents/DocumentsDashboard";
import { userIdFromTokenSub } from "@/lib/auth/user-id";
import { loadVisibleDocuments } from "@/lib/documents/list";
import { ownDocumentsHref, shouldRedirectSignedInDocuments } from "@/lib/documents/list-destination";
import { parseSortKey } from "@/lib/documents/sort";

export const metadata: Metadata = {
  title: "Documents | DocTalk",
};

type DocumentsPageProps = {
  searchParams: Promise<{ upload?: string; demo?: string; sort?: string }>;
};

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const { upload, demo, sort } = await searchParams;
  const session = await auth();
  const viewerUserId = userIdFromTokenSub(session?.user?.id);
  if (shouldRedirectSignedInDocuments(viewerUserId !== null, demo)) {
    redirect(ownDocumentsHref());
  }
  const { source, documents } = await loadVisibleDocuments(null);

  return (
    <DocumentsDashboard
      documents={documents}
      source={source}
      signedIn={viewerUserId !== null}
      headerAccount={<AccountMenu variant="text" redirectTo="/documents" />}
      bannerAccount={
        viewerUserId ? null : (
          <AccountMenu variant="text" redirectTo="/documents" />
        )
      }
      initialUploadOpen={upload === "1" && viewerUserId === null}
      initialSort={parseSortKey(sort)}
    />
  );
}

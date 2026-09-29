import type { Metadata } from "next";
import { auth } from "@/auth";
import { AccountMenu } from "@/components/AccountMenu";
import { DocumentsDashboard } from "@/components/documents/DocumentsDashboard";
import { userIdFromTokenSub } from "@/lib/auth/user-id";
import { loadVisibleDocuments } from "@/lib/documents/list";

export const metadata: Metadata = {
  title: "Documents | DocTalk",
};

type DocumentsPageProps = {
  searchParams: Promise<{ upload?: string }>;
};

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const { upload } = await searchParams;
  const session = await auth();
  const viewerUserId = userIdFromTokenSub(session?.user?.id);
  const { source, documents } = await loadVisibleDocuments(viewerUserId);

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
      initialUploadOpen={upload === "1"}
    />
  );
}

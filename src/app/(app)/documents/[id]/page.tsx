import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccountMenu } from "@/components/AccountMenu";
import { DocumentWorkspace } from "@/components/workspace/DocumentWorkspace";
import { decideDocumentAccess, safeCallbackPath } from "@/lib/auth/access";
import { userIdFromTokenSub } from "@/lib/auth/user-id";
import { getDemoDocument } from "@/lib/demo-documents";
import { lookupDocument } from "@/lib/documents/lookup";
import { pdfSrcFor } from "@/lib/documents/upload-policy";

type DocumentPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({
  params,
}: DocumentPageProps): Promise<Metadata> {
  const { id } = await params;
  const demo = getDemoDocument(id);
  if (demo) {
    return { title: `${demo.title} | DocTalk` };
  }

  if (!process.env.DATABASE_URL) {
    return { title: "Document | DocTalk" };
  }

  const lookup = await lookupDocument(id);
  if (lookup.status === "found") {
    return { title: `${lookup.document.fileName} | DocTalk` };
  }

  return { title: "Document | DocTalk" };
}

export default async function DocumentPage({
  params,
  searchParams,
}: DocumentPageProps) {
  const { id } = await params;
  const { page } = await searchParams;
  const parsed = page ? Number.parseInt(page, 10) : undefined;
  const headerAccount = (
    <AccountMenu variant="text" redirectTo={`/documents/${id}`} />
  );

  if (!process.env.DATABASE_URL) {
    return (
      <DocumentWorkspace
        document={getDemoDocument(id) ?? null}
        documentId={id}
        initialPage={parsed}
        headerAccount={headerAccount}
      />
    );
  }

  const session = await auth();
  const viewerUserId = userIdFromTokenSub(session?.user?.id);
  const lookup = await lookupDocument(id);
  const decision = decideDocumentAccess(viewerUserId, lookup);

  if (decision === "sign-in") {
    redirect(
      `/sign-in?callbackUrl=${encodeURIComponent(safeCallbackPath(`/documents/${id}`))}`,
    );
  }

  if (decision !== "allow" || lookup.status !== "found") {
    notFound();
  }

  const status = lookup.document.status;
  const documentStatus =
    status === "processing" || status === "failed" || status === "ready"
      ? status
      : "ready";

  return (
    <DocumentWorkspace
      document={null}
      documentId={id}
      initialPage={parsed}
      headerAccount={headerAccount}
      fileName={lookup.document.fileName}
      pdfSrc={pdfSrcFor(id, lookup.document.fileUrl)}
      documentStatus={documentStatus}
      canDelete={
        viewerUserId !== null &&
        lookup.document.userId === viewerUserId &&
        !lookup.document.isDemo
      }
    />
  );
}

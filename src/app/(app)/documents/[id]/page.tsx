import type { Metadata } from "next";
import { DocumentWorkspace } from "@/components/workspace/DocumentWorkspace";
import { getDemoDocument } from "@/lib/demo-documents";

type DocumentPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({
  params,
}: DocumentPageProps): Promise<Metadata> {
  const { id } = await params;
  const document = getDemoDocument(id);
  return {
    title: `${document ? document.title : "Document"} | DocTalk`,
  };
}

export default async function DocumentPage({
  params,
  searchParams,
}: DocumentPageProps) {
  const { id } = await params;
  const { page } = await searchParams;
  const parsed = page ? Number.parseInt(page, 10) : undefined;

  return (
    <DocumentWorkspace
      document={getDemoDocument(id) ?? null}
      documentId={id}
      initialPage={parsed}
      signInHref="/sign-in"
    />
  );
}

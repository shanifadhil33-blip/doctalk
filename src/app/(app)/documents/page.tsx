import type { Metadata } from "next";
import { DocumentsDashboard } from "@/components/documents/DocumentsDashboard";
import { demoDocuments } from "@/lib/demo-documents";

export const metadata: Metadata = {
  title: "Documents | DocTalk",
};

type DocumentsPageProps = {
  searchParams: Promise<{ upload?: string }>;
};

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const { upload } = await searchParams;
  return (
    <DocumentsDashboard
      documents={demoDocuments}
      signInHref="/sign-in"
      initialUploadOpen={upload === "1"}
    />
  );
}

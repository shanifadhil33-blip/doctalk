import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SignedInPreview } from "@/components/preview/SignedInPreview";
import { signedInPreviewEnabled } from "@/lib/preview-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview | DocTalk",
  robots: { index: false, follow: false },
};

type PreviewPageProps = {
  searchParams: Promise<{ view?: string }>;
};

export default async function SignedInPreviewPage({ searchParams }: PreviewPageProps) {
  if (!signedInPreviewEnabled()) notFound();
  const { view } = await searchParams;
  const screen =
    view === "documents" || view === "demo" || view === "settings" ? view : "home";
  return <SignedInPreview view={screen} />;
}

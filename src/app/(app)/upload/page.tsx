import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { userIdFromTokenSub } from "@/lib/auth/user-id";
import { ownDocumentsHref } from "@/lib/documents/list-destination";

export default async function UploadPage() {
  const session = await auth();
  if (userIdFromTokenSub(session?.user?.id)) {
    redirect(ownDocumentsHref());
  }
  redirect("/documents?upload=1");
}

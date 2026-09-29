import { redirect } from "next/navigation";

export default function UploadPage() {
  redirect("/documents?upload=1");
}

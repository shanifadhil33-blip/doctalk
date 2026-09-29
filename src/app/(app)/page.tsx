import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "DocTalk",
  description: "Ask a PDF a question and see the page the answer came from.",
};

export default function HomePage() {
  return <LandingPage signInHref="/sign-in" demoHref="/documents" />;
}

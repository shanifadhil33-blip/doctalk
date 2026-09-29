import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  description: "Ask a PDF a question and see the page the answer came from.",
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return children;
}

"use client";

import { usePathname } from "next/navigation";
import {
  DocumentLoading,
  DocumentsLoading,
  HomeLoading,
  SettingsLoading,
} from "@/components/route-skeletons";
import { useSignedIn } from "@/components/session-flag";

export default function AppLoading() {
  const pathname = usePathname();
  const signedIn = useSignedIn();

  const path = typeof window === "undefined" ? pathname : window.location.pathname;

  if (path === "/settings") return <SettingsLoading />;
  if (path.startsWith("/documents/")) return <DocumentLoading />;
  if (path === "/documents") return <DocumentsLoading />;
  return <HomeLoading signedIn={signedIn} />;
}

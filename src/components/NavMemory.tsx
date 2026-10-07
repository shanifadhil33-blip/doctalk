"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { rememberNavFrom } from "@/lib/nav-return";

export function NavMemory() {
  const pathname = usePathname();

  useEffect(() => {
    rememberNavFrom(pathname, window.location.search);
  }, [pathname]);

  return null;
}

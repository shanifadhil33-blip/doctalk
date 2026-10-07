"use client";

import { useLayoutEffect, useState } from "react";
import { BackLink } from "@/components/BackLink";
import { readNavFrom } from "@/lib/nav-return";

export function SettingsBack() {
  const [target, setTarget] = useState({ href: "/", label: "Home" });

  useLayoutEffect(() => {
    setTarget(readNavFrom());
  }, []);

  return <BackLink href={target.href}>{target.label}</BackLink>;
}

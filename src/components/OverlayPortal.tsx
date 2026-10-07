"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Draw overlays on document.body so a transformed or view-transition parent cannot trap them. */
export function OverlayPortal({ children }: { children: ReactNode }) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setContainer(document.body);
  }, []);

  if (!container) return null;
  return createPortal(children, container);
}

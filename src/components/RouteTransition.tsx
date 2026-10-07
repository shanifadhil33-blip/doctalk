"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { applyPendingListScroll, disarmListScroll, rememberListScroll } from "@/components/list-scroll";

function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function internalAnchor(event: MouseEvent): HTMLAnchorElement | null {
  if (event.defaultPrevented || event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const target = event.target;
  if (!(target instanceof Element)) return null;
  if (target.closest("button, input, select, textarea")) return null;
  const anchor = target.closest("a");
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  if (anchor.target && anchor.target !== "_self") return null;
  if (anchor.hasAttribute("download")) return null;
  const url = new URL(anchor.href, window.location.origin);
  if (url.origin !== window.location.origin) return null;
  if (url.pathname === window.location.pathname && url.search === window.location.search) return null;
  return anchor;
}

export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const shellRef = useRef<HTMLDivElement>(null);
  const seenPath = useRef<string | null>(null);
  const routeKey = pathname;

  useLayoutEffect(() => {
    if (pathname === "/") disarmListScroll("documents");
    applyPendingListScroll();
  }, [pathname]);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    if (seenPath.current === null) {
      seenPath.current = routeKey;
      return;
    }
    if (seenPath.current === routeKey) return;
    seenPath.current = routeKey;
    if (prefersReducedMotion()) return;
    const main = shell.querySelector("#main");
    const target = main instanceof HTMLElement ? main : shell;
    target.classList.remove("route-fade");
    void target.offsetWidth;
    target.classList.add("route-fade");
  }, [routeKey]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const anchor = internalAnchor(event);
      if (!anchor) return;
      const path = window.location.pathname;
      if (path === "/") rememberListScroll("home");
      if (path === "/documents") rememberListScroll("documents");
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return (
    <div ref={shellRef} className="min-h-dvh bg-[#f5f6f8]">
      {children}
    </div>
  );
}

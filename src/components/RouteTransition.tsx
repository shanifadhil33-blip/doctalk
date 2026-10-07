"use client";

import { usePathname, useRouter } from "next/navigation";
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

function waitForRoute(pathname: string, search: string): Promise<void> {
  const started = performance.now();
  return new Promise((resolve) => {
    const check = () => {
      const arrived =
        window.location.pathname === pathname && window.location.search === search;
      if (arrived || performance.now() - started > 2000) {
        window.requestAnimationFrame(() => resolve());
        return;
      }
      window.requestAnimationFrame(check);
    };
    check();
  });
}

export function RouteTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const routerRef = useRef(router);
  routerRef.current = router;
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
    if (prefersReducedMotion() || typeof document.startViewTransition === "function") return;
    shell.classList.remove("route-fade");
    void shell.offsetWidth;
    shell.classList.add("route-fade");
  }, [routeKey]);

  useEffect(() => {
    function markPressed(event: Event) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const control = target.closest("a, button");
      if (!(control instanceof HTMLElement)) return;
      control.setAttribute("data-pressed", "true");
    }

    function releasePressed() {
      window.setTimeout(() => {
        document.querySelectorAll("[data-pressed='true']").forEach((node) => {
          node.removeAttribute("data-pressed");
        });
      }, 160);
    }

    function onClick(event: MouseEvent) {
      const anchor = internalAnchor(event);
      if (!anchor) return;
      const path = window.location.pathname;
      if (path === "/") rememberListScroll("home");
      if (path === "/documents") rememberListScroll("documents");
      if (prefersReducedMotion() || typeof document.startViewTransition !== "function") return;
      const url = new URL(anchor.href, window.location.origin);
      const href = `${url.pathname}${url.search}${url.hash}`;
      const scroll = anchor.dataset.scroll !== "false";
      event.preventDefault();
      const go = () => {
        routerRef.current.push(href, { scroll });
      };
      try {
        const transition = document.startViewTransition(async () => {
          go();
          await waitForRoute(url.pathname, url.search);
        });
        void transition.finished.catch(() => {
          // A skipped transition still leaves the router on the new URL.
        });
      } catch {
        go();
      }
    }

    document.addEventListener("pointerdown", markPressed, true);
    document.addEventListener("pointerup", releasePressed, true);
    document.addEventListener("pointercancel", releasePressed, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("pointerdown", markPressed, true);
      document.removeEventListener("pointerup", releasePressed, true);
      document.removeEventListener("pointercancel", releasePressed, true);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return (
    <div ref={shellRef} className="min-h-dvh bg-[#f5f6f8]">
      {children}
    </div>
  );
}

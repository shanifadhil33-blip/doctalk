"use client";

import { useEffect } from "react";

const prefix = "doctalk.listScroll.";

export function rememberListScroll(key: string): void {
  try {
    sessionStorage.setItem(prefix + key, String(window.scrollY));
  } catch {
    // Private browsing can block storage. The list still opens.
  }
}

export function readListScroll(key: string): number | null {
  try {
    const raw = sessionStorage.getItem(prefix + key);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : null;
  } catch {
    return null;
  }
}

export function useRestoreListScroll(key: string): void {
  useEffect(() => {
    const y = readListScroll(key);
    if (y === null) return;
    const restore = () => window.scrollTo(0, y);
    restore();
    const frame = window.requestAnimationFrame(restore);
    const timer = window.setTimeout(restore, 50);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [key]);
}

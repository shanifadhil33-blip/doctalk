"use client";

import { useEffect, useLayoutEffect } from "react";

const prefix = "doctalk.listScroll.";
const armPrefix = "doctalk.listScrollArm.";

export function rememberListScroll(key: string): void {
  try {
    sessionStorage.setItem(prefix + key, String(window.scrollY));
    sessionStorage.setItem(armPrefix + key, "1");
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

export function listScrollArmed(key: string): boolean {
  try {
    return sessionStorage.getItem(armPrefix + key) === "1";
  } catch {
    return false;
  }
}

export function disarmListScroll(key: string): void {
  try {
    sessionStorage.removeItem(armPrefix + key);
  } catch {
    // Ignore storage failures.
  }
}

let pendingScrollY: number | null = null;

export function applyPendingListScroll(): void {
  if (pendingScrollY === null) return;
  const y = pendingScrollY;
  pendingScrollY = null;
  window.scrollTo(0, y);
}

/** Restore a list's scroll before paint. Fresh visits stay at the top. */
export function useRestoreListScroll(key: string, consume = true): void {
  useLayoutEffect(() => {
    if (!listScrollArmed(key)) return;
    const y = readListScroll(key);
    if (consume) disarmListScroll(key);
    if (y === null || y === 0) return;
    pendingScrollY = y;
    window.scrollTo(0, y);
  }, [key, consume]);

  useEffect(() => {
    pendingScrollY = null;
  });
}

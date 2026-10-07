"use client";

import { useEffect, useRef, type RefObject } from "react";

export function useDialog(
  open: boolean,
  onClose: () => void,
  options?: {
    locked?: boolean;
    initialFocusRef?: RefObject<HTMLElement | null>;
  },
): RefObject<HTMLDivElement | null> {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const lockedRef = useRef(options?.locked ?? false);
  const initialFocusRef = options?.initialFocusRef;
  lockedRef.current = options?.locked ?? false;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const initial = initialFocusRef?.current;
    if (initial) initial.focus();
    else dialog.focus();

    function focusable() {
      if (!dialog) return [];
      return Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
        ),
      );
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (lockedRef.current) return;
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, initialFocusRef]);

  return dialogRef;
}

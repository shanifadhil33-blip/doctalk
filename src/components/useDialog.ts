"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

export function useDialog(
  open: boolean,
  onClose: () => void,
  options?: {
    locked?: boolean;
    initialFocusRef?: RefObject<HTMLElement | null>;
  },
): (node: HTMLDivElement | null) => void {
  const [dialogNode, setDialogNode] = useState<HTMLDivElement | null>(null);
  const setDialogRef = useCallback((node: HTMLDivElement | null) => {
    setDialogNode((current) => (current === node ? current : node));
  }, []);
  const onCloseRef = useRef(onClose);
  const lockedRef = useRef(options?.locked ?? false);
  const initialFocusRef = options?.initialFocusRef;
  lockedRef.current = options?.locked ?? false;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useLayoutEffect(() => {
    if (!open || !dialogNode) return;
    const dialog = dialogNode;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
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
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      previouslyFocused?.focus();
    };
  }, [open, dialogNode, initialFocusRef]);

  return setDialogRef;
}

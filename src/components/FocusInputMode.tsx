"use client";

import { useEffect } from "react";

const keys = new Set([
  "Tab",
  "ArrowDown",
  "ArrowUp",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
]);

export function FocusInputMode() {
  useEffect(() => {
    const root = document.documentElement;

    function onPointer() {
      root.dataset.input = "pointer";
    }

    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (!keys.has(event.key)) return;
      root.dataset.input = "keyboard";
    }

    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, []);

  return null;
}

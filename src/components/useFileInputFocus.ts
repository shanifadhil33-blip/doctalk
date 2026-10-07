"use client";

import { useEffect, type RefObject } from "react";

export function blurFileInputIfPointer(input: HTMLInputElement) {
  if (document.documentElement.dataset.input === "keyboard") return;
  input.blur();
}

/** A cancelled file picker leaves the input focused. Drop that focus after a click or tap. */
export function useBlurFileInputOnCancel(
  inputRef: RefObject<HTMLInputElement | null>,
  active = true,
) {
  useEffect(() => {
    if (!active) return;
    const input = inputRef.current;
    if (!input) return;
    const node = input;

    function release() {
      blurFileInputIfPointer(node);
      window.setTimeout(() => blurFileInputIfPointer(node), 0);
    }

    input.addEventListener("cancel", release);
    return () => input.removeEventListener("cancel", release);
  }, [inputRef, active]);
}

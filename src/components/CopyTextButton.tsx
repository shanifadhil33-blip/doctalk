"use client";

import { useEffect, useRef, useState } from "react";
import { copyButtonClass } from "@/components/button-styles";

export const COPY_FEEDBACK_MS = 1600;

export function CopyTextButton({
  text,
  label,
}: {
  text: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    };
  }, []);

  return (
    <button
      type="button"
      className={copyButtonClass}
      aria-live="polite"
      aria-label={copied ? "Copied" : label}
      onClick={() => {
        void copyText(text).then((ok) => {
          if (!ok) return;
          setCopied(true);
          if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
          resetTimer.current = window.setTimeout(() => {
            setCopied(false);
            resetTimer.current = null;
          }, COPY_FEEDBACK_MS);
        });
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the selection fallback.
  }

  if (typeof document.execCommand !== "function") return false;

  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

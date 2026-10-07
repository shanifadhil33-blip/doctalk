"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  dialogBackdropClass,
  dialogPanelClass,
  primaryButtonClass,
  secondaryButtonClass,
  textButtonClass,
} from "@/components/button-styles";
import { OverlayPortal } from "@/components/OverlayPortal";
import { RollingMark } from "@/components/RollingMark";
import { useDialog } from "@/components/useDialog";

function motionMs(): number {
  if (typeof window.matchMedia !== "function") return 0;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 150;
}

export function SignOutButton({
  action,
  variant = "text",
  hideTrigger = false,
  opener,
}: {
  action: () => void | Promise<void>;
  variant?: "text" | "button";
  hideTrigger?: boolean;
  opener?: { current: (() => void) | null };
}) {
  const [phase, setPhase] = useState<"closed" | "open" | "closing">("closed");

  useEffect(() => {
    if (!opener) return;
    opener.current = () => setPhase("open");
    return () => {
      opener.current = null;
    };
  }, [opener]);

  useEffect(() => {
    if (phase !== "closing") return;
    const timer = window.setTimeout(() => setPhase("closed"), motionMs());
    return () => window.clearTimeout(timer);
  }, [phase]);

  function requestClose() {
    setPhase((current) => (current === "open" ? "closing" : current));
  }

  return (
    <>
      {hideTrigger ? null : (
        <button
          type="button"
          className={variant === "button" ? secondaryButtonClass : textButtonClass}
          onClick={() => setPhase("open")}
        >
          Sign out
        </button>
      )}
      {phase === "closed" ? null : (
        <SignOutDialog leaving={phase === "closing"} action={action} onClose={requestClose} />
      )}
    </>
  );
}

function SignOutDialog({
  leaving,
  action,
  onClose,
}: {
  leaving: boolean;
  action: () => void | Promise<void>;
  onClose: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useDialog(!leaving, onClose, {
    locked: pending,
    initialFocusRef: cancelRef,
  });

  async function confirm() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await action();
    } catch {
      setPending(false);
      setError("Couldn't sign out. Try again.");
    }
  }

  return (
    <OverlayPortal>
    <div
      className={`${dialogBackdropClass} sign-out-dialog`}
      data-state={leaving ? "close" : "open"}
      onPointerDown={(event) => {
        if (pending || leaving) return;
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={`${dialogPanelClass} sign-out-dialog-panel`}
        data-state={leaving ? "close" : "open"}
      >
        <div className="min-h-0 overflow-y-auto px-5 py-5">
          <h2 id={titleId} className="text-lg font-semibold text-slate-950">
            Sign out of DocTalk?
          </h2>
          <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-slate-600">
            You&apos;ll need to sign in again to see your documents.
          </p>
          {error ? (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            className={`${secondaryButtonClass} w-full sm:w-auto`}
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`${primaryButtonClass} w-full sm:w-auto`}
            onClick={() => void confirm()}
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? <RollingMark /> : null}
            {pending ? "Signing out" : "Sign out"}
          </button>
        </div>
      </div>
    </div>
    </OverlayPortal>
  );
}

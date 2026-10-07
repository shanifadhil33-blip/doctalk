"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { controlFocusClass, textButtonClass } from "@/components/button-styles";
import { rememberListScroll } from "@/components/list-scroll";
import { SignOutButton } from "@/components/SignOutButton";

function motionMs(): number {
  if (typeof window.matchMedia !== "function") return 0;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 150;
}

function useNarrowScreen(): boolean {
  const [narrow, setNarrow] = useState(false);

  useLayoutEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(max-width: 639px)");
    const apply = () => setNarrow(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  return narrow;
}

const rowClass = [
  "flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-medium text-slate-800",
  "cursor-pointer hover:bg-slate-100 active:bg-slate-200",
  controlFocusClass,
].join(" ");

export function AccountControls({
  name,
  email,
  showSettings = true,
  signOutAction,
}: {
  name: string;
  email: string | null;
  showSettings?: boolean;
  signOutAction: () => void | Promise<void>;
}) {
  const narrow = useNarrowScreen();
  const pathname = usePathname();
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const signOutOpener = useRef<(() => void) | null>(null);
  const [phase, setPhase] = useState<"closed" | "open" | "closing">("closed");
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null);
  const onDocuments = pathname === "/documents";
  const onSettings = pathname === "/settings";

  useEffect(() => {
    setPhase("closed");
  }, [pathname]);

  useEffect(() => {
    if (phase !== "closing") return;
    const timer = window.setTimeout(() => setPhase("closed"), motionMs());
    return () => window.clearTimeout(timer);
  }, [phase]);

  useLayoutEffect(() => {
    if (phase === "closed") return;
    const trigger = triggerRef.current;
    if (!trigger) return;
    function place() {
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const width = Math.min(240, window.innerWidth - 16);
      let left = rect.right - width;
      if (left < 8) left = 8;
      if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - 8 - width);
      const menuHeight = menuRef.current?.offsetHeight ?? 220;
      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const top = spaceBelow < menuHeight && rect.top > spaceBelow ? Math.max(8, rect.top - 4 - menuHeight) : rect.bottom + 4;
      setBox({ top, left, width });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "open") return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setPhase("closing");
      }
    }
    function onPointer(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setPhase("closing");
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer, true);
    };
  }, [phase]);

  function rememberHere() {
    if (pathname === "/") rememberListScroll("home");
    if (pathname === "/documents") rememberListScroll("documents");
  }

  function closeMenu() {
    setPhase((current) => (current === "open" ? "closing" : current));
  }

  const links = (
    <>
      <Link
        href="/documents"
        prefetch={true}
        className={narrow ? rowClass : textButtonClass}
        aria-current={onDocuments ? "page" : undefined}
        role={narrow ? "menuitem" : undefined}
        onClick={() => {
          rememberHere();
          closeMenu();
        }}
      >
        Documents
      </Link>
      {showSettings ? (
        <Link
          href="/settings"
          prefetch={true}
          className={narrow ? rowClass : textButtonClass}
          aria-current={onSettings ? "page" : undefined}
          role={narrow ? "menuitem" : undefined}
          onClick={() => {
            rememberHere();
            closeMenu();
          }}
        >
          Settings
        </Link>
      ) : null}
    </>
  );

  const initial = name.trim().charAt(0).toUpperCase() || "A";

  return (
    <>
      {narrow ? (
        <button
          ref={triggerRef}
          type="button"
          className={[
            "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#4f46e5] text-sm font-semibold text-white",
            "cursor-pointer hover:bg-[#3730a3] active:bg-[#312e81]",
            controlFocusClass,
          ].join(" ")}
          aria-haspopup="menu"
          aria-expanded={phase === "open"}
          aria-controls={menuId}
          aria-label={`Account menu for ${name}`}
          onClick={() => setPhase((current) => (current === "open" ? "closing" : "open"))}
        >
          {initial}
        </button>
      ) : (
        <div className="flex min-w-0 items-center gap-1">
          {links}
          <span className="max-w-[10rem] min-w-0 truncate px-2 text-sm text-slate-600" aria-label={name}>
            {name}
          </span>
          <SignOutButton action={signOutAction} />
        </div>
      )}
      {narrow && phase !== "closed" && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label="Account"
              data-state={phase === "open" ? "open" : "close"}
              className="option-menu fixed z-40 rounded-lg border border-slate-200 bg-white p-1 shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
              style={box ? { top: box.top, left: box.left, width: box.width } : { top: 8, right: 8, width: 240 }}
            >
              <div className="px-3 py-2">
                <p className="truncate text-sm font-medium text-slate-950">{name}</p>
                {email ? <p className="truncate text-xs text-slate-500">{email}</p> : null}
              </div>
              {links}
              <button
                type="button"
                role="menuitem"
                className={rowClass}
                onClick={() => {
                  setPhase("closed");
                  signOutOpener.current?.();
                }}
              >
                Sign out
              </button>
            </div>,
            document.body,
          )
        : null}
      {narrow ? <SignOutButton action={signOutAction} hideTrigger opener={signOutOpener} /> : null}
    </>
  );
}

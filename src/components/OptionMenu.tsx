"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { controlFocusClass, overlayZ } from "@/components/button-styles";
import { CheckGlyph, ChevronDownGlyph } from "@/components/icons";
import { pointerMoved } from "@/components/press-intent";

export type MenuOption<T extends string> = {
  value: T;
  label: string;
};

type Box = { top: number; left: number; width: number; maxHeight: number };

const edge = 8;
const gap = 4;
const rowHeight = 44;

export function placeOptionMenu(
  trigger: { top: number; left: number; bottom: number; width: number },
  viewport: { width: number; height: number },
  itemCount: number,
): Box {
  const natural = itemCount * rowHeight + 8;
  const width = Math.min(Math.max(trigger.width, 176), Math.max(rowHeight, viewport.width - edge * 2));
  let left = trigger.left;
  if (left + width > viewport.width - edge) {
    left = Math.max(edge, viewport.width - edge - width);
  }
  const spaceBelow = viewport.height - trigger.bottom - gap - edge;
  const spaceAbove = trigger.top - gap - edge;
  const openUp = spaceBelow < Math.min(natural, 160) && spaceAbove > spaceBelow;
  const maxHeight = Math.max(rowHeight, Math.min(natural, openUp ? spaceAbove : spaceBelow));
  const height = Math.min(natural, maxHeight);
  const top = openUp ? trigger.top - gap - height : trigger.bottom + gap;
  return { top: Math.max(edge, top), left, width, maxHeight };
}

function motionMs(): number {
  if (typeof window.matchMedia !== "function") return 0;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 150;
}

export function OptionMenu<T extends string>({
  id,
  labelledBy,
  value,
  options,
  onChange,
  className = "",
}: {
  id?: string;
  labelledBy?: string;
  value: T;
  options: readonly MenuOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  const reactId = useId();
  const menuId = id ?? reactId;
  const listId = `${menuId}-list`;
  const currentId = `${menuId}-current`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const gesture = useRef<{ value: T; x: number; y: number } | null>(null);
  const handled = useRef(false);
  const moved = useRef(false);
  const ignoreTriggerClick = useRef(false);
  const chooseRef = useRef<(next: T) => void>(() => undefined);
  onChangeRef.current = onChange;
  const [phase, setPhase] = useState<"closed" | "open" | "closing">("closed");
  const [active, setActive] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const currentIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const current = options[currentIndex];

  function openAt(index: number) {
    setActive(Math.min(Math.max(index, 0), options.length - 1));
    setPhase("open");
  }

  function close() {
    setPhase((currentPhase) => (currentPhase === "closed" ? currentPhase : "closing"));
  }

  function choose(next: T) {
    if (handled.current) return;
    handled.current = true;
    ignoreTriggerClick.current = true;
    onChangeRef.current(next);
    close();
    triggerRef.current?.focus({ preventScroll: true });
    window.setTimeout(() => {
      ignoreTriggerClick.current = false;
    }, 0);
  }
  chooseRef.current = choose;

  useEffect(() => {
    if (phase !== "closing") return;
    const timer = window.setTimeout(() => setPhase("closed"), motionMs());
    return () => window.clearTimeout(timer);
  }, [phase]);

  useLayoutEffect(() => {
    if (phase === "closed") return;
    function update() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setPhase("closing");
        return;
      }
      setBox(
        placeOptionMenu(
          { top: rect.top, left: rect.left, bottom: rect.bottom, width: rect.width },
          { width: window.innerWidth, height: window.innerHeight },
          options.length,
        ),
      );
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [phase, options.length]);

  useEffect(() => {
    if (phase !== "open") return;
    function onPointerUp(event: PointerEvent) {
      const start = gesture.current;
      gesture.current = null;
      if (!start) return;
      moved.current = pointerMoved(start, event);
      if (moved.current) return;
      chooseRef.current(start.value);
    }
    window.addEventListener("pointerup", onPointerUp, true);
    return () => window.removeEventListener("pointerup", onPointerUp, true);
  }, [phase]);

  useEffect(() => {
    if (phase === "closed") return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setPhase("closing");
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [phase]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (phase !== "open") {
        openAt(event.key === "ArrowUp" ? options.length - 1 : currentIndex);
        return;
      }
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((index) => (index + step + options.length) % options.length);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      if (phase !== "open") openAt(0);
      else setActive(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      if (phase !== "open") openAt(options.length - 1);
      else setActive(options.length - 1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (phase !== "open") openAt(currentIndex);
      else {
        const option = options[active];
        if (option) choose(option.value);
      }
      return;
    }
    if (event.key === "Escape" && phase !== "closed") {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  }

  const shown = phase !== "closed" && box;

  return (
    <>
      <button
        ref={triggerRef}
        id={menuId}
        type="button"
        data-open={phase === "closed" ? "false" : "true"}
        className={`menu-trigger inline-flex h-11 min-h-11 w-48 shrink-0 cursor-pointer touch-manipulation items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white py-0 pl-3 pr-3 text-left text-sm text-slate-800 transition-colors duration-150 motion-reduce:transition-none ${controlFocusClass} ${className}`}
        aria-haspopup="listbox"
        aria-expanded={phase !== "closed"}
        aria-controls={listId}
        aria-activedescendant={phase === "open" ? `${menuId}-option-${active}` : undefined}
        aria-labelledby={labelledBy ? `${labelledBy} ${currentId}` : undefined}
        onClick={() => {
          if (ignoreTriggerClick.current) return;
          if (phase === "open") close();
          else openAt(currentIndex);
        }}
        onKeyDown={onKeyDown}
      >
        <span id={currentId} className="whitespace-nowrap">
          {current?.label}
        </span>
        <ChevronDownGlyph
          className={`h-4 w-4 shrink-0 text-slate-500 ${phase === "open" ? "rotate-180" : ""}`}
        />
      </button>
      {shown
        ? createPortal(
            <div
              ref={menuRef}
              data-state={phase === "open" ? "open" : "close"}
              className={`option-menu fixed ${overlayZ.dropdown} overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]`}
              style={{ top: box.top, left: box.left, width: box.width, maxHeight: box.maxHeight }}
            >
              <ul
                id={listId}
                role="listbox"
                aria-labelledby={labelledBy}
                className="max-h-[inherit] overflow-y-auto p-1"
              >
                {options.map((option, index) => {
                  const selected = option.value === value;
                  return (
                    <li key={option.value} role="presentation">
                      <div
                        id={`${menuId}-option-${index}`}
                        role="option"
                        aria-selected={selected}
                        className={`flex min-h-11 cursor-pointer touch-manipulation items-center justify-between gap-3 rounded-md px-3 text-sm text-slate-800 ${index === active ? "bg-slate-100" : ""} ${selected ? "font-medium" : ""}`}
                        onMouseEnter={() => setActive(index)}
                        onPointerDown={(event) => {
                          if (event.button !== 0) return;
                          handled.current = false;
                          moved.current = false;
                          gesture.current = {
                            value: option.value,
                            x: event.clientX,
                            y: event.clientY,
                          };
                        }}
                        onClick={(event) => {
                          if (handled.current || moved.current || pointerMoved(gesture.current, event)) {
                            event.preventDefault();
                            return;
                          }
                          choose(option.value);
                        }}
                      >
                        <span className="min-w-0 truncate">{option.label}</span>
                        <span className="grid h-4 w-4 shrink-0 place-items-center text-[#4f46e5]" aria-hidden="true">
                          {selected ? <CheckGlyph className="h-4 w-4" /> : null}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

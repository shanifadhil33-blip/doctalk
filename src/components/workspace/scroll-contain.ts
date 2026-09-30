import { useEffect, type RefObject } from "react";

/**
 * A swipe stays inside this box only while the box can still move that way.
 * A gesture that starts with room never gets handed to the page when it later
 * hits the edge. A gesture that starts at that edge, or on a box that is not
 * overflowing, is left to the page.
 */
export function useContainedScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const scroller = ref.current;
    if (!scroller) return;
    const node: HTMLElement = scroller;

    let lastY = 0;
    let gesture: "contain" | "page" | null = null;

    function roomInDirection(deltaY: number) {
      const limit = node.scrollHeight - node.clientHeight;
      if (limit <= 0) return false;
      if (deltaY > 0) return node.scrollTop > 0;
      return node.scrollTop < limit - 1;
    }

    function onStart(event: TouchEvent) {
      lastY = event.touches[0]?.clientY ?? 0;
      gesture = null;
    }

    function onEnd() {
      gesture = null;
    }

    function onMove(event: TouchEvent) {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (!touch) return;
      const deltaY = touch.clientY - lastY;
      lastY = touch.clientY;
      if (deltaY === 0) return;

      if (gesture === null) {
        gesture = roomInDirection(deltaY) ? "contain" : "page";
      }

      if (gesture === "page") return;

      if (!roomInDirection(deltaY)) {
        event.preventDefault();
      }
    }

    node.addEventListener("touchstart", onStart, { passive: true });
    node.addEventListener("touchmove", onMove, { passive: false });
    node.addEventListener("touchend", onEnd);
    node.addEventListener("touchcancel", onEnd);
    return () => {
      node.removeEventListener("touchstart", onStart);
      node.removeEventListener("touchmove", onMove);
      node.removeEventListener("touchend", onEnd);
      node.removeEventListener("touchcancel", onEnd);
    };
  }, [ref]);
}

/** Stop the browser from shifting scroll position to chase nested content. */
export function useStableDocumentScroll() {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overflowAnchor;
    root.style.overflowAnchor = "none";
    return () => {
      root.style.overflowAnchor = previous;
    };
  }, []);
}

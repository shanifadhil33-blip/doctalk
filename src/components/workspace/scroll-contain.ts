import { useEffect, type RefObject } from "react";

/**
 * Keep a finger that starts on this scroller inside it.
 * At the top or bottom, the gesture must not chain into the page.
 */
export function useContainedScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const scroller = ref.current;
    if (!scroller) return;
    const node: HTMLElement = scroller;

    let lastY = 0;

    function onStart(event: TouchEvent) {
      lastY = event.touches[0]?.clientY ?? 0;
    }

    function onMove(event: TouchEvent) {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (!touch) return;
      const deltaY = touch.clientY - lastY;
      lastY = touch.clientY;
      if (deltaY === 0) return;

      const limit = node.scrollHeight - node.clientHeight;
      const atTop = node.scrollTop <= 0;
      const atBottom = limit <= 0 || node.scrollTop >= limit - 1;
      const pullingPastTop = atTop && deltaY > 0;
      const pullingPastBottom = atBottom && deltaY < 0;
      if (pullingPastTop || pullingPastBottom) {
        event.preventDefault();
      }
    }

    node.addEventListener("touchstart", onStart, { passive: true });
    node.addEventListener("touchmove", onMove, { passive: false });
    return () => {
      node.removeEventListener("touchstart", onStart);
      node.removeEventListener("touchmove", onMove);
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

// @vitest-environment jsdom
import "@/test/setup";
import { useRef } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useContainedScroll } from "@/components/workspace/scroll-contain";

function Harness() {
  const ref = useRef<HTMLDivElement>(null);
  useContainedScroll(ref);
  return <div ref={ref} data-testid="scroller" />;
}

function touch(type: "touchstart" | "touchmove", clientY: number) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "touches", { value: [{ clientY }] });
  return event;
}

describe("useContainedScroll", () => {
  it("blocks a pull past the top and the bottom, and allows a move inside the list", () => {
    const view = render(<Harness />);
    const scroller = view.getByTestId("scroller");
    Object.defineProperty(scroller, "scrollHeight", { configurable: true, value: 400 });
    Object.defineProperty(scroller, "clientHeight", { configurable: true, value: 100 });
    scroller.scrollTop = 0;

    scroller.dispatchEvent(touch("touchstart", 40));
    const pastTop = touch("touchmove", 90);
    scroller.dispatchEvent(pastTop);
    expect(pastTop.defaultPrevented).toBe(true);

    scroller.scrollTop = 40;
    scroller.dispatchEvent(touch("touchstart", 90));
    const inside = touch("touchmove", 50);
    scroller.dispatchEvent(inside);
    expect(inside.defaultPrevented).toBe(false);

    scroller.scrollTop = 300;
    scroller.dispatchEvent(touch("touchstart", 80));
    const pastBottom = touch("touchmove", 20);
    scroller.dispatchEvent(pastBottom);
    expect(pastBottom.defaultPrevented).toBe(true);
  });
});

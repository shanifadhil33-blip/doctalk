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

function setMetrics(scroller: HTMLElement, scrollHeight: number, clientHeight: number) {
  Object.defineProperty(scroller, "scrollHeight", { configurable: true, value: scrollHeight });
  Object.defineProperty(scroller, "clientHeight", { configurable: true, value: clientHeight });
}

describe("useContainedScroll", () => {
  it("lets the page take a swipe that starts with nowhere to go", () => {
    const view = render(<Harness />);
    const scroller = view.getByTestId("scroller");
    setMetrics(scroller, 100, 100);
    scroller.scrollTop = 0;

    scroller.dispatchEvent(touch("touchstart", 40));
    const downOnEmpty = touch("touchmove", 90);
    scroller.dispatchEvent(downOnEmpty);
    expect(downOnEmpty.defaultPrevented).toBe(false);

    scroller.dispatchEvent(touch("touchstart", 90));
    const upOnEmpty = touch("touchmove", 40);
    scroller.dispatchEvent(upOnEmpty);
    expect(upOnEmpty.defaultPrevented).toBe(false);
  });

  it("lets the page take a swipe that already starts at that edge", () => {
    const view = render(<Harness />);
    const scroller = view.getByTestId("scroller");
    setMetrics(scroller, 400, 100);

    scroller.scrollTop = 0;
    scroller.dispatchEvent(touch("touchstart", 40));
    const pullDownAtTop = touch("touchmove", 90);
    scroller.dispatchEvent(pullDownAtTop);
    expect(pullDownAtTop.defaultPrevented).toBe(false);

    scroller.scrollTop = 300;
    scroller.dispatchEvent(touch("touchstart", 80));
    const pullUpAtBottom = touch("touchmove", 20);
    scroller.dispatchEvent(pullUpAtBottom);
    expect(pullUpAtBottom.defaultPrevented).toBe(false);
  });

  it("leaves a swipe in the middle of the list to the box", () => {
    const view = render(<Harness />);
    const scroller = view.getByTestId("scroller");
    setMetrics(scroller, 400, 100);
    scroller.scrollTop = 40;

    scroller.dispatchEvent(touch("touchstart", 90));
    const inside = touch("touchmove", 50);
    scroller.dispatchEvent(inside);
    expect(inside.defaultPrevented).toBe(false);
  });

  it("keeps the rest of a gesture inside the box after it hits an edge", () => {
    const view = render(<Harness />);
    const scroller = view.getByTestId("scroller");
    setMetrics(scroller, 400, 100);
    scroller.scrollTop = 40;

    scroller.dispatchEvent(touch("touchstart", 100));
    const towardTop = touch("touchmove", 140);
    scroller.dispatchEvent(towardTop);
    expect(towardTop.defaultPrevented).toBe(false);

    scroller.scrollTop = 0;
    const pastTop = touch("touchmove", 180);
    scroller.dispatchEvent(pastTop);
    expect(pastTop.defaultPrevented).toBe(true);

    scroller.scrollTop = 40;
    scroller.dispatchEvent(touch("touchstart", 100));
    const towardBottom = touch("touchmove", 60);
    scroller.dispatchEvent(towardBottom);
    expect(towardBottom.defaultPrevented).toBe(false);

    scroller.scrollTop = 300;
    const pastBottom = touch("touchmove", 20);
    scroller.dispatchEvent(pastBottom);
    expect(pastBottom.defaultPrevented).toBe(true);
  });
});

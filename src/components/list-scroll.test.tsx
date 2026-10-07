// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { useLayoutEffect } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  applyPendingListScroll,
  disarmListScroll,
  listScrollArmed,
  rememberListScroll,
  useRestoreListScroll,
} from "@/components/list-scroll";

function installScroll() {
  let y = 0;
  Object.defineProperty(window, "scrollY", {
    configurable: true,
    get: () => y,
  });
  window.scrollTo = ((x?: number | ScrollToOptions, top?: number) => {
    if (typeof x === "object" && x) {
      y = x.top ?? y;
      return;
    }
    y = typeof top === "number" ? top : 0;
  }) as typeof window.scrollTo;
}

function Restore({ listKey }: { listKey: string }) {
  useRestoreListScroll(listKey);
  return <div>list</div>;
}

function Clobber() {
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  });
  return null;
}

function Harness() {
  useLayoutEffect(() => {
    applyPendingListScroll();
  });
  return (
    <>
      <Restore listKey="documents" />
      <Clobber />
    </>
  );
}

describe("list scroll", () => {
  beforeEach(() => {
    installScroll();
    sessionStorage.clear();
  });

  it("restores an armed list before the next visit paints, then forgets the arm", () => {
    window.scrollTo(0, 480);
    rememberListScroll("documents");
    expect(listScrollArmed("documents")).toBe(true);

    window.scrollTo(0, 0);
    render(<Restore listKey="documents" />);
    expect(window.scrollY).toBe(480);
    expect(listScrollArmed("documents")).toBe(false);
  });

  it("puts the list back after a later scroll reset in the same commit", () => {
    window.scrollTo(0, 551);
    rememberListScroll("documents");
    window.scrollTo(0, 0);
    render(<Harness />);
    expect(window.scrollY).toBe(551);
  });

  it("leaves a fresh visit at the top", () => {
    window.scrollTo(0, 480);
    rememberListScroll("documents");
    disarmListScroll("documents");
    window.scrollTo(0, 0);
    render(<Restore listKey="documents" />);
    expect(window.scrollY).toBe(0);
    expect(listScrollArmed("documents")).toBe(false);
  });
});

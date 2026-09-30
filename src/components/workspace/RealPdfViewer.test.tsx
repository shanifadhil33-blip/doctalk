// @vitest-environment jsdom
import "@/test/setup";
import { useEffect, useRef, type ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { fittedPageWidth } from "@/components/workspace/pdf-fit";
import { RealPdfViewer } from "@/components/workspace/RealPdfViewer";

vi.mock("react-pdf", () => {
  return {
    pdfjs: { GlobalWorkerOptions: { workerSrc: "" } },
    Document: ({
      children,
      file,
      onLoadSuccess,
    }: {
      children: ReactNode;
      file: string;
      onLoadSuccess?: (result: { numPages: number }) => void;
    }) => {
      const started = useRef(false);
      useEffect(() => {
        if (started.current) return;
        started.current = true;
        onLoadSuccess?.({ numPages: 5 });
      }, [onLoadSuccess]);
      return <div data-testid="pdf-document" data-file={file}>{children}</div>;
    },
    Page: ({ pageNumber, width }: { pageNumber: number; width: number }) => (
      <div data-testid="pdf-page" data-page={pageNumber} data-width={width} />
    ),
  };
});

class TestResizeObserver {
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    Object.defineProperty(target, "clientWidth", { configurable: true, value: 400 });
    this.callback([], this as unknown as ResizeObserver);
  }

  unobserve() {}

  disconnect() {}
}

describe("RealPdfViewer", () => {
  it("stacks every page at the pane width and drops the pager", async () => {
    vi.stubGlobal("ResizeObserver", TestResizeObserver);
    const scrollTo = vi.fn();
    HTMLElement.prototype.scrollTo = scrollTo;
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const onPageCount = vi.fn();

    const view = render(
      <RealPdfViewer
        fileUrl="/demo/sample-data-policy.pdf"
        fileName="Sample_Data_Policy.pdf"
        page={1}
        onPageCount={onPageCount}
      />,
    );

    const pages = await screen.findAllByTestId("pdf-page");
    expect(pages).toHaveLength(5);
    expect(pages.map((page) => page.getAttribute("data-page"))).toEqual(["1", "2", "3", "4", "5"]);
    const fitted = fittedPageWidth(398, 100);
    for (const page of pages) {
      expect(page.getAttribute("data-width")).toBe(String(fitted));
    }
    expect(screen.getByRole("article", { name: "Page 2" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Previous page" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next page" })).not.toBeInTheDocument();
    expect(screen.queryByText("1 / 5")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fit width" })).toBeInTheDocument();
    expect(onPageCount).toHaveBeenCalledWith(5);
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(scrollTo).not.toHaveBeenCalled();
    const pane = document.getElementById("pdf-scroll");
    expect(pane?.className).toContain("overflow-y-auto");
    expect(pane?.className.split(/\s+/)).toContain("flex-1");
    expect(pane?.className).toContain("min-h-0");
    expect(pane?.className.split(/\s+/)).toContain("overflow-x-hidden");
    const frame = pane?.parentElement;
    const frameClass = frame?.className.split(/\s+/) ?? [];
    expect(frameClass).toContain("h-[50dvh]");
    expect(frameClass).toContain("max-h-[50dvh]");
    expect(frameClass).toContain("overflow-hidden");
    expect(pane?.className.split(/\s+/)).toContain("overscroll-y-contain");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    await waitFor(() => {
      expect(screen.getAllByTestId("pdf-page")[0]).toHaveAttribute(
        "data-width",
        String(fittedPageWidth(398, 110)),
      );
    });
    await user.click(screen.getByRole("button", { name: "Fit width" }));
    await waitFor(() => {
      expect(screen.getAllByTestId("pdf-page")[0]).toHaveAttribute("data-width", String(fitted));
    });

    view.rerender(
      <RealPdfViewer
        fileUrl="/demo/sample-data-policy.pdf"
        fileName="Sample_Data_Policy.pdf"
        page={3}
        onPageCount={onPageCount}
      />,
    );
    await waitFor(() => {
      expect(scrollTo.mock.instances).toContain(document.getElementById("pdf-scroll"));
    });
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});

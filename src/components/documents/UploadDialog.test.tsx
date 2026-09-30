// @vitest-environment jsdom
import "@/test/setup";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UploadDialog } from "@/components/documents/UploadDialog";
import { MAX_PDF_BYTES } from "@/lib/upload-validation";

function renderDialog() {
  const onClose = vi.fn();
  const onOpenDocument = vi.fn();
  render(
    <UploadDialog open onClose={onClose} onOpenDocument={onOpenDocument} />,
  );
  return { onClose, onOpenDocument };
}

describe("UploadDialog", () => {
  it("rejects a file that is not a PDF", () => {
    renderDialog();
    const input = screen.getByLabelText("Choose a PDF or Markdown file");

    fireEvent.change(input, {
      target: {
        files: [new File(["hello"], "notes.txt", { type: "text/plain" })],
      },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Only PDF and Markdown files can be uploaded.",
    );
    expect(screen.queryByText("notes.txt")).not.toBeInTheDocument();
  });

  it("rejects a PDF over the 10 MB cap", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.upload(
      screen.getByLabelText("Choose a PDF or Markdown file"),
      new File([new Uint8Array(MAX_PDF_BYTES + 1)], "large.pdf", {
        type: "application/pdf",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "PDF must be 10 MB or smaller.",
    );
    expect(screen.queryByText("large.pdf")).not.toBeInTheDocument();
  });

  it("accepts a small PDF and keeps Open document unavailable until reading finishes", async () => {
    const user = userEvent.setup();
    const { onOpenDocument } = renderDialog();

    await user.upload(
      screen.getByLabelText("Choose a PDF or Markdown file"),
      new File(["%PDF-1.4"], "lease-agreement.pdf", { type: "application/pdf" }),
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("lease-agreement.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open document" })).toBeDisabled();
    expect(onOpenDocument).not.toHaveBeenCalled();
  });
});

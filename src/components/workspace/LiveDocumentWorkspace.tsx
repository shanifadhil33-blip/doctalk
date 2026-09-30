"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UploadGlyph } from "@/components/icons";
import { primaryButtonClass, secondaryButtonClass } from "@/components/button-styles";
import { SiteFooter } from "@/components/SiteFooter";
import { SkipLink } from "@/components/SkipLink";
import { TopBar } from "@/components/TopBar";
import { AssistantAnswer } from "@/components/workspace/AnswerBlock";
import { DocumentHeading } from "@/components/workspace/DocumentHeading";
import type { Citation } from "@/lib/document-types";

const RealPdfViewer = dynamic(
  () => import("@/components/workspace/RealPdfViewer").then((mod) => mod.RealPdfViewer),
  {
    ssr: false,
    loading: () => <p className="p-6 text-sm text-slate-600">Loading PDF...</p>,
  },
);

type ThreadMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string; citations: Citation[] };

type DocumentStatus = "processing" | "ready" | "failed";

export function LiveDocumentWorkspace({
  documentId,
  fileName,
  pdfSrc,
  initialPage,
  headerAccount,
  documentStatus,
  canDelete,
}: {
  documentId: string;
  fileName: string;
  pdfSrc: string;
  initialPage?: number;
  headerAccount: ReactNode;
  documentStatus: DocumentStatus;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [page, setPage] = useState(initialPage && initialPage > 0 ? initialPage : 1);
  const [pageCount, setPageCount] = useState(0);
  const [activePassageId, setActivePassageId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [liveStatus, setLiveStatus] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const ready = documentStatus === "ready";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const question = draft.trim();
    if (!question || pending || !ready) return;
    const userId = `user-${messages.length + 1}`;
    const assistantId = `assistant-${messages.length + 1}`;
    setDraft("");
    setPending(true);
    setMessages((current) => [...current, { id: userId, role: "user", text: question }]);
    setLiveStatus("Looking through the document.");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, question }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const text = readError(payload) ?? "Could not answer that question. Try again later.";
        setMessages((current) => [
          ...current,
          { id: assistantId, role: "assistant", text, citations: [] },
        ]);
        setLiveStatus(text);
        return;
      }
      const answer = readAnswer(payload) ?? "That is not in this document.";
      const citations = readCitations(payload, assistantId);
      setMessages((current) => [
        ...current,
        { id: assistantId, role: "assistant", text: answer, citations },
      ]);
      setLiveStatus(answer);
      const first = citations[0];
      if (first) {
        setPage(first.page);
        setActivePassageId(first.passageId);
      }
    } catch {
      const text = "Could not answer that question. Try again later.";
      setMessages((current) => [
        ...current,
        { id: assistantId, role: "assistant", text, citations: [] },
      ]);
      setLiveStatus(text);
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    if (!canDelete || pending) return;
    if (!window.confirm("Delete this document?")) return;
    setDeleteError(null);
    const response = await fetch(`/api/documents/${documentId}`, { method: "DELETE" });
    if (!response.ok) {
      const payload: unknown = await response.json().catch(() => null);
      setDeleteError(readError(payload) ?? "Could not delete that document.");
      return;
    }
    router.push("/documents");
    router.refresh();
  }

  const pageCountLabel = pageCount > 0 ? `${pageCount} pages · PDF` : "PDF";

  return (
    <div className="flex min-h-screen w-full min-w-0 max-w-full flex-col overflow-x-hidden bg-[#f5f6f8] lg:h-dvh">
      <SkipLink />
      <TopBar
        leading={<DocumentHeading title={fileName} meta={pageCountLabel} />}
        actions={
          <>
            {canDelete ? (
              <button type="button" className={secondaryButtonClass} onClick={() => void onDelete()}>
                Delete
              </button>
            ) : null}
            <Link href="/documents?upload=1" className={secondaryButtonClass}>
              <UploadGlyph />
              <span className="hidden sm:inline">Upload PDF</span>
            </Link>
            {headerAccount}
          </>
        }
      />
      <main id="main" className="flex w-full min-w-0 max-w-full flex-1 flex-col overflow-x-hidden lg:min-h-0 lg:flex-row">
        <RealPdfViewer
          fileUrl={pdfSrc}
          fileName={fileName}
          page={page}
          onPageChange={(nextPage) => {
            setPage(nextPage);
            setActivePassageId(null);
          }}
          onPageCount={setPageCount}
        />
        <aside className="flex min-h-[28rem] w-full min-w-0 max-w-full shrink-0 flex-col border-t border-slate-200 bg-white lg:min-h-0 lg:w-[420px] lg:border-l lg:border-t-0">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-950">Ask this document</h2>
            <p className="mt-1 text-sm text-slate-500">
              {pageCount > 0 ? `${pageCount} pages` : "PDF"}
            </p>
          </div>
          <div className="flex-1 space-y-4 overflow-auto px-4 py-4">
            <p className="sr-only" aria-live="polite">
              {liveStatus}
            </p>
            {deleteError ? (
              <p role="alert" className="text-sm text-red-700">
                {deleteError}
              </p>
            ) : null}
            {!ready ? (
              <p className="text-sm leading-relaxed text-slate-600">
                {documentStatus === "processing"
                  ? "This document is still processing."
                  : "This document could not be processed."}
              </p>
            ) : null}
            {messages.length === 0 && ready ? (
              <p className="text-sm leading-relaxed text-slate-600">
                Ask a question about this document. Sources point at the page they came from.
              </p>
            ) : null}
            <ol aria-label="Conversation" className="space-y-4">
              {messages.map((message) =>
                message.role === "user" ? (
                  <li key={message.id} className="flex justify-end">
                    <div className="max-w-[90%] rounded-2xl rounded-br-md bg-slate-100 px-3 py-2 text-sm text-slate-800">
                      <p className="text-[11px] text-slate-500">Question</p>
                      <p>{message.text}</p>
                    </div>
                  </li>
                ) : (
                  <li key={message.id}>
                    <AssistantAnswer
                      text={message.text}
                      citations={message.citations}
                      activePassageId={activePassageId}
                      onSelectCitation={(citation) => {
                        setPage(citation.page);
                        setActivePassageId(citation.passageId);
                      }}
                    />
                  </li>
                ),
              )}
            </ol>
          </div>
          <form onSubmit={(event) => void onSubmit(event)} className="min-w-0 border-t border-slate-200 p-4">
            <label htmlFor="question" className="sr-only">
              Ask a question about this document
            </label>
            <div className="flex items-center gap-2">
              <input
                id="question"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask a question about this document"
                disabled={!ready || pending}
                className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 transition-colors duration-150 hover:border-slate-400 focus-visible:border-[#4f46e5] disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:hover:border-slate-200"
              />
              <button
                type="submit"
                className={primaryButtonClass}
                disabled={!ready || pending || !draft.trim()}
              >
                {pending ? "Sending" : "Send"}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Press Enter to send</p>
          </form>
        </aside>
      </main>
      <SiteFooter />
    </div>
  );
}

function readError(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("error" in payload)) return null;
  return typeof payload.error === "string" ? payload.error : null;
}

function readAnswer(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("answer" in payload)) return null;
  return typeof payload.answer === "string" ? payload.answer : null;
}

function readCitations(payload: unknown, assistantId: string): Citation[] {
  if (!payload || typeof payload !== "object" || !("citations" in payload)) return [];
  const citations = payload.citations;
  if (!Array.isArray(citations)) return [];
  const parsed: Citation[] = [];
  citations.forEach((item, index) => {
    if (!item || typeof item !== "object") return;
    const page = "page" in item ? item.page : undefined;
    const excerpt = "excerpt" in item ? item.excerpt : undefined;
    if (typeof page !== "number" || !Number.isInteger(page) || page < 1) return;
    if (typeof excerpt !== "string" || !excerpt.trim()) return;
    parsed.push({
      page,
      passageId: `${assistantId}-${index}`,
      quote: excerpt,
    });
  });
  return parsed;
}

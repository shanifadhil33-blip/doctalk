"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { DownloadGlyph, UploadGlyph } from "@/components/icons";
import { primaryButtonClass, secondaryButtonClass } from "@/components/button-styles";
import { SiteFooter } from "@/components/SiteFooter";
import { SkipLink } from "@/components/SkipLink";
import { TopBar } from "@/components/TopBar";
import { CitationChip } from "@/components/workspace/CitationChip";
import { PdfPageViewer } from "@/components/workspace/PdfPageViewer";
import { answerQuestion } from "@/lib/answer-question";
import type { Citation, DemoDocument } from "@/lib/document-types";
import { recallUploadFile, readSessionUploads, type SessionUpload } from "@/lib/session-uploads";

type ThreadMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string; citations: Citation[] };

export function DocumentWorkspace({
  document,
  documentId,
  initialPage,
  signInHref,
}: {
  document: DemoDocument | null;
  documentId: string;
  initialPage?: number;
  signInHref: string;
}) {
  if (document) {
    return (
      <IndexedWorkspace
        document={document}
        initialPage={initialPage}
        signInHref={signInHref}
      />
    );
  }

  return <UnindexedWorkspace documentId={documentId} signInHref={signInHref} />;
}

function IndexedWorkspace({
  document,
  initialPage,
  signInHref,
}: {
  document: DemoDocument;
  initialPage?: number;
  signInHref: string;
}) {
  const startingPage = clampPage(initialPage, document.pageCount) ?? document.intro.citations[0]?.page ?? 1;
  const startingPassage =
    document.intro.citations.find((citation) => citation.page === startingPage)?.passageId ??
    document.intro.citations[0]?.passageId ??
    null;

  const [page, setPage] = useState(startingPage);
  const [activePassageId, setActivePassageId] = useState<string | null>(startingPassage);
  const [messages, setMessages] = useState<ThreadMessage[]>([
    { id: "user-intro", role: "user", text: document.intro.question },
    {
      id: "assistant-intro",
      role: "assistant",
      text: document.intro.answer,
      citations: document.intro.citations,
    },
  ]);
  const [draft, setDraft] = useState("");
  const [liveStatus, setLiveStatus] = useState("");
  const [nextId, setNextId] = useState(1);

  const citationCount = new Set(
    messages.flatMap((message) =>
      message.role === "assistant" ? message.citations.map((citation) => citation.passageId) : [],
    ),
  ).size;

  function showCitation(citation: Citation) {
    setPage(citation.page);
    setActivePassageId(citation.passageId);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const question = draft.trim();
    if (!question) return;
    const result = answerQuestion(document, question);
    const userId = `user-${nextId}`;
    const assistantId = `assistant-${nextId}`;
    setNextId((value) => value + 1);
    const assistant: ThreadMessage = result
      ? {
          id: assistantId,
          role: "assistant",
          text: result.answer,
          citations: result.citations,
        }
      : {
          id: assistantId,
          role: "assistant",
          text: "I could not find that in this document.",
          citations: [],
        };
    setMessages((current) => [
      ...current,
      { id: userId, role: "user", text: question },
      assistant,
    ]);
    setDraft("");
    setLiveStatus(assistant.role === "assistant" ? assistant.text : "");
    const first = result?.citations[0];
    if (first) showCitation(first);
  }

  function exportNotes() {
    const lines = [document.title, ""];
    for (const message of messages) {
      if (message.role === "user") {
        lines.push(`Question: ${message.text}`, "");
      } else {
        lines.push(`Answer: ${message.text}`);
        for (const citation of message.citations) {
          lines.push(`Source p. ${citation.page}`, citation.quote);
        }
        lines.push("");
      }
    }
    downloadText(`${document.fileName.replace(/\.pdf$/i, "")}-notes.txt`, lines.join("\n"));
  }

  return (
    <WorkspaceFrame
      title={`${document.title} (${document.counterparty})`}
      pageCountLabel={`${document.pageCount} pages · PDF`}
      signInHref={signInHref}
      onExport={exportNotes}
    >
      <PdfPageViewer
        fileName={document.fileName}
        pages={document.pages}
        page={page}
        activePassageId={activePassageId}
        onPageChange={(nextPage, passageId) => {
          setPage(nextPage);
          setActivePassageId(passageId);
        }}
      />
      <ChatColumn
        citationCount={citationCount}
        messages={messages}
        activePassageId={activePassageId}
        draft={draft}
        pageCount={document.pageCount}
        liveStatus={liveStatus}
        onDraft={setDraft}
        onSubmit={onSubmit}
        onSelectCitation={showCitation}
      />
    </WorkspaceFrame>
  );
}

function UnindexedWorkspace({
  documentId,
  signInHref,
}: {
  documentId: string;
  signInHref: string;
}) {
  const [upload, setUpload] = useState<SessionUpload | null | undefined>(undefined);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    const match = readSessionUploads().find((item) => item.id === documentId) ?? null;
    setUpload(match);
    const file = recallUploadFile(documentId);
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [documentId]);

  if (upload === undefined) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] p-6" aria-busy="true" aria-live="polite">
        <p className="sr-only">Loading document</p>
        <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="h-[70vh] animate-pulse rounded-xl bg-white" />
          <div className="h-80 animate-pulse rounded-xl bg-white" />
        </div>
      </div>
    );
  }

  if (!upload) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f5f6f8]">
        <SkipLink />
        <TopBar actions={<GoogleSignInButton href={signInHref} variant="text" />} />
        <main id="main" className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold text-slate-950">Document not found</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            This demo does not have a document with that link.
          </p>
          <Link href="/documents" className={`${primaryButtonClass} mt-6 self-center`}>
            Back to documents
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <WorkspaceFrame
      title={upload.fileName}
      pageCountLabel="PDF"
      signInHref={signInHref}
      onExport={() =>
        downloadText(
          `${upload.fileName.replace(/\.pdf$/i, "")}-notes.txt`,
          `${upload.fileName}\n\nThis file is not indexed, so there are no cited answers to export.`,
        )
      }
    >
      <div className="flex min-h-[70vh] flex-col bg-[#eef0f3] lg:min-h-0 lg:flex-1">
        {fileUrl ? (
          <iframe title={upload.fileName} src={fileUrl} className="min-h-[70vh] w-full flex-1 bg-white" />
        ) : (
          <div className="m-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <h2 className="text-base font-semibold text-slate-950">Preview unavailable</h2>
            <p className="mt-2 text-sm text-slate-600">
              This browser session no longer has the file. Upload it again from Documents.
            </p>
          </div>
        )}
      </div>
      <aside className="flex flex-col border-t border-slate-200 bg-white lg:w-[400px] lg:border-l lg:border-t-0">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-950">Ask this document</h2>
          <p className="mt-1 text-sm text-slate-500">Not indexed yet</p>
        </div>
        <div className="flex-1 px-5 py-6">
          <p className="text-sm leading-relaxed text-slate-600">
            Sample documents can answer from their pages. This file was only checked for type and size.
          </p>
          <Link href="/documents/master-services-agreement" className={`${secondaryButtonClass} mt-4`}>
            Open a sample contract
          </Link>
        </div>
      </aside>
    </WorkspaceFrame>
  );
}

function WorkspaceFrame({
  title,
  pageCountLabel,
  signInHref,
  onExport,
  children,
}: {
  title: string;
  pageCountLabel: string;
  signInHref: string;
  onExport: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f6f8] lg:h-dvh">
      <SkipLink />
      <TopBar
        leading={
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <span className="text-slate-300" aria-hidden="true">
              /
            </span>
            <h1 className="truncate font-medium text-slate-950">{title}</h1>
            <span className="hidden shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 sm:inline">
              {pageCountLabel}
            </span>
          </div>
        }
        actions={
          <>
            <Link href="/documents?upload=1" className={secondaryButtonClass}>
              <UploadGlyph />
              <span className="hidden sm:inline">Upload PDF</span>
            </Link>
            <button type="button" className={secondaryButtonClass} onClick={onExport}>
              <DownloadGlyph />
              <span className="hidden sm:inline">Export</span>
            </button>
            <GoogleSignInButton href={signInHref} variant="text" />
          </>
        }
      />
      <main id="main" className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

function ChatColumn({
  citationCount,
  messages,
  activePassageId,
  draft,
  pageCount,
  liveStatus,
  onDraft,
  onSubmit,
  onSelectCitation,
}: {
  citationCount: number;
  messages: ThreadMessage[];
  activePassageId: string | null;
  draft: string;
  pageCount: number;
  liveStatus: string;
  onDraft: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onSelectCitation: (citation: Citation) => void;
}) {
  return (
    <aside className="flex min-h-[28rem] flex-col border-t border-slate-200 bg-white lg:min-h-0 lg:w-[400px] lg:border-l lg:border-t-0">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">Ask this document</h2>
        <p className="mt-1 text-sm text-slate-500">
          {citationCount} {citationCount === 1 ? "citation" : "citations"} indexed
        </p>
      </div>
      <div className="flex-1 space-y-4 overflow-auto px-4 py-4">
        <p className="sr-only" aria-live="polite">
          {liveStatus}
        </p>
        <ol aria-label="Conversation" className="space-y-4">
          {messages.map((message) =>
            message.role === "user" ? (
              <li key={message.id} className="flex justify-end">
                <div className="max-w-[90%] rounded-2xl rounded-br-md bg-slate-100 px-3 py-2 text-sm text-slate-800">
                  <p className="text-[11px] text-slate-500">Question</p>
                  <p>{message.text}</p>
                  <p className="mt-1 text-right text-[11px] text-slate-400">Just now</p>
                </div>
              </li>
            ) : (
              <li key={message.id}>
                <article className="rounded-xl border border-slate-200 p-3 text-sm leading-relaxed text-slate-800">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Answer
                  </p>
                  <p className="mt-1">{message.text}</p>
                  {message.citations.length > 0 ? (
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <p className="text-xs text-slate-500">Sources</p>
                      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Sources">
                        {message.citations.map((citation) => (
                          <CitationChip
                            key={citation.passageId}
                            page={citation.page}
                            active={citation.passageId === activePassageId}
                            onSelect={() => onSelectCitation(citation)}
                          />
                        ))}
                      </div>
                      <SelectedQuote
                        citation={
                          message.citations.find((citation) => citation.passageId === activePassageId) ??
                          message.citations[0]
                        }
                      />
                    </div>
                  ) : null}
                </article>
              </li>
            ),
          )}
        </ol>
      </div>
      <form onSubmit={onSubmit} className="border-t border-slate-200 p-4">
        <label htmlFor="question" className="sr-only">
          Ask a question about this document
        </label>
        <div className="flex items-center gap-2">
          <input
            id="question"
            value={draft}
            onChange={(event) => onDraft(event.target.value)}
            placeholder="Ask a question about this document"
            className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm text-slate-900"
          />
          <button type="submit" className={primaryButtonClass} disabled={!draft.trim()}>
            Send
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
          <p>Press Enter to send</p>
          <p>{pageCount} pages indexed</p>
        </div>
      </form>
    </aside>
  );
}

function SelectedQuote({ citation }: { citation: Citation | undefined }) {
  if (!citation) return null;
  return (
    <blockquote className="mt-3 border-l-4 border-[#f3e2a6] bg-[#fff8df] px-3 py-2 text-sm text-slate-800">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#8a5a12]">
        Passage · Page {citation.page}
      </p>
      <p className="mt-1">{citation.quote}</p>
    </blockquote>
  );
}

function clampPage(page: number | undefined, pageCount: number): number | undefined {
  if (!page || !Number.isFinite(page)) return undefined;
  if (page < 1 || page > pageCount) return undefined;
  return page;
}

function downloadText(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

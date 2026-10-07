"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UploadGlyph } from "@/components/icons";
import { primaryButtonClass, secondaryButtonClass } from "@/components/button-styles";
import { SiteFooter } from "@/components/SiteFooter";
import { SkipLink } from "@/components/SkipLink";
import { TopBar } from "@/components/TopBar";
import { DeleteDocumentDialog } from "@/components/documents/DeleteDocumentDialog";
import { AssistantAnswer } from "@/components/workspace/AnswerBlock";
import { DocumentHeading } from "@/components/workspace/DocumentHeading";
import { LiveDocumentWorkspace } from "@/components/workspace/LiveDocumentWorkspace";
import { PdfPageViewer } from "@/components/workspace/PdfPageViewer";
import { QuestionField } from "@/components/workspace/QuestionField";
import { answerQuestion } from "@/lib/answer-question";
import type { Citation, DemoDocument } from "@/lib/document-types";
import { isMarkdownFileName } from "@/lib/markdown/sections";
import { recallUploadFile, readSessionUploads, type SessionUpload } from "@/lib/session-uploads";
import { useContainedScroll, useStableDocumentScroll } from "@/components/workspace/scroll-contain";

type ThreadMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string; citations: Citation[] };

export function DocumentWorkspace({
  document,
  documentId,
  initialPage,
  headerAccount,
  fileName,
  pdfSrc,
  documentStatus,
  canDelete,
  localAnswers,
}: {
  document: DemoDocument | null;
  documentId: string;
  initialPage?: number;
  headerAccount: ReactNode;
  fileName?: string;
  pdfSrc?: string;
  documentStatus?: "processing" | "ready" | "failed";
  canDelete?: boolean;
  localAnswers?: boolean;
}) {
  if (document) {
    return (
      <IndexedWorkspace
        document={document}
        initialPage={initialPage}
        headerAccount={headerAccount}
      />
    );
  }

  if (fileName && pdfSrc) {
    return (
      <LiveDocumentWorkspace
        documentId={documentId}
        fileName={fileName}
        pdfSrc={pdfSrc}
        initialPage={initialPage}
        headerAccount={headerAccount}
        documentStatus={documentStatus ?? "ready"}
        canDelete={canDelete ?? false}
        localAnswers={localAnswers}
      />
    );
  }

  if (fileName) {
    return (
      <StoredDocumentShell
        documentId={documentId}
        fileName={fileName}
        headerAccount={headerAccount}
        canDelete={canDelete ?? false}
        documentStatus={documentStatus}
      />
    );
  }

  return <UnindexedWorkspace documentId={documentId} headerAccount={headerAccount} />;
}

function IndexedWorkspace({
  document,
  initialPage,
  headerAccount,
}: {
  document: DemoDocument;
  initialPage?: number;
  headerAccount: ReactNode;
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

  return (
    <WorkspaceFrame
      title={`${document.title} (${document.counterparty})`}
      pageCountLabel={`${document.pageCount} pages · PDF`}
      headerAccount={headerAccount}
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
  headerAccount,
}: {
  documentId: string;
  headerAccount: ReactNode;
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
      <div className="min-h-dvh bg-[#f5f6f8] p-6" aria-busy="true" aria-live="polite">
        <p className="sr-only">Loading document</p>
        <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="h-[50dvh] animate-pulse rounded-xl bg-white" />
          <div className="h-80 animate-pulse rounded-xl bg-white" />
        </div>
      </div>
    );
  }

  if (upload && fileUrl && isMarkdownFileName(upload.fileName)) {
    return (
      <LiveDocumentWorkspace
        documentId={documentId}
        fileName={upload.fileName}
        pdfSrc={fileUrl}
        headerAccount={headerAccount}
        documentStatus="ready"
        canDelete={false}
        localAnswers
      />
    );
  }

  if (!upload) {
    return (
      <div className="flex min-h-dvh min-w-0 max-w-full flex-col overflow-x-hidden bg-[#f5f6f8]">
        <SkipLink />
        <TopBar actions={headerAccount} />
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
      headerAccount={headerAccount}
    >
      <div className="flex h-[50dvh] max-h-[50dvh] w-full min-w-0 shrink-0 flex-col bg-[#eef0f3] lg:h-full lg:max-h-none lg:min-h-0 lg:flex-1">
        {fileUrl ? (
          <iframe title={upload.fileName} src={fileUrl} className="h-full min-h-0 w-full flex-1 bg-white" />
        ) : (
          <div className="m-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <h2 className="text-base font-semibold text-slate-950">Preview unavailable</h2>
            <p className="mt-2 text-sm text-slate-600">
              This browser session no longer has the file. Upload it again from Documents.
            </p>
          </div>
        )}
      </div>
      <aside className="flex w-full min-w-0 max-w-full shrink-0 flex-col border-t border-slate-200 bg-white lg:w-[420px] lg:border-l lg:border-t-0">
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

function StoredDocumentShell({
  documentId,
  fileName,
  headerAccount,
  canDelete,
  documentStatus,
}: {
  documentId: string;
  fileName: string;
  headerAccount: ReactNode;
  canDelete: boolean;
  documentStatus?: "processing" | "ready" | "failed";
}) {
  const router = useRouter();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const note =
    documentStatus === "processing"
      ? "This PDF is still being prepared. Delete it if you want that spot back."
      : documentStatus === "failed"
        ? "This PDF could not be read. Delete it to free a spot."
        : "This document is in your library. Page text is not available in this view yet.";

  function askToDelete() {
    if (!canDelete || deletePending) return;
    setDeleteError(null);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!canDelete || deletePending) return;
    setDeletePending(true);
    setDeleteError(null);
    const response = await fetch(`/api/documents/${documentId}`, { method: "DELETE" });
    if (!response.ok) {
      setDeleteError("Could not delete that document.");
      setDeletePending(false);
      return;
    }
    router.push("/documents");
    router.refresh();
  }

  return (
    <>
    <WorkspaceFrame title={fileName} pageCountLabel="PDF" headerAccount={headerAccount}>
      <div className="flex h-[50dvh] max-h-[50dvh] w-full min-w-0 shrink-0 flex-col items-center justify-center bg-[#eef0f3] px-6 text-center lg:h-full lg:max-h-none lg:min-h-0 lg:flex-1">
        <h2 className="text-base font-semibold text-slate-950">{fileName}</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">{note}</p>
        {canDelete ? (
          <button type="button" className={`${secondaryButtonClass} mt-4`} onClick={askToDelete}>
            Delete
          </button>
        ) : null}
      </div>
      <aside className="flex w-full min-w-0 max-w-full shrink-0 flex-col border-t border-slate-200 bg-white lg:w-[420px] lg:border-l lg:border-t-0">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-950">Ask this document</h2>
          <p className="mt-1 text-sm text-slate-500">Not indexed yet</p>
        </div>
        <div className="flex-1 px-5 py-6">
          <p className="text-sm leading-relaxed text-slate-600">
            Answers from a stored document are not available in this view yet.
          </p>
        </div>
      </aside>
    </WorkspaceFrame>
    <DeleteDocumentDialog
      open={deleteOpen}
      documentName={fileName}
      fileName={fileName}
      pending={deletePending}
      error={deleteError}
      onCancel={() => {
        if (deletePending) return;
        setDeleteOpen(false);
      }}
      onConfirm={() => void confirmDelete()}
    />
    </>
  );
}

function WorkspaceFrame({
  title,
  pageCountLabel,
  headerAccount,
  children,
}: {
  title: string;
  pageCountLabel: string;
  headerAccount: ReactNode;
  children: ReactNode;
}) {
  useStableDocumentScroll();
  return (
    <div className="flex min-h-dvh w-full min-w-0 max-w-full flex-col overflow-x-hidden bg-[#f5f6f8] [overflow-anchor:none] lg:h-dvh">
      <SkipLink />
      <TopBar
        leading={<DocumentHeading title={title} meta={pageCountLabel} />}
        actions={
          <>
            <Link
              href="/documents?upload=1"
              className={secondaryButtonClass}
              aria-label="Upload PDF or Markdown"
            >
              <UploadGlyph />
              <span className="hidden sm:inline">Upload PDF or Markdown</span>
            </Link>
            {headerAccount}
          </>
        }
      />
      <main id="main" className="flex w-full min-w-0 max-w-full flex-1 flex-col overflow-x-hidden lg:min-h-0 lg:flex-row">
        {children}
      </main>
      <div className="h-24 shrink-0 lg:hidden" aria-hidden="true" />
      <SiteFooter />
    </div>
  );
}

function ChatColumn({
  messages,
  activePassageId,
  draft,
  pageCount,
  liveStatus,
  onDraft,
  onSubmit,
  onSelectCitation,
}: {
  messages: ThreadMessage[];
  activePassageId: string | null;
  draft: string;
  pageCount: number;
  liveStatus: string;
  onDraft: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onSelectCitation: (citation: Citation) => void;
}) {
  const answerScrollRef = useRef<HTMLDivElement>(null);
  useContainedScroll(answerScrollRef);
  return (
    <aside className="flex h-[85dvh] max-h-[85dvh] w-full min-w-0 max-w-full shrink-0 flex-col overflow-hidden border-t border-slate-200 bg-white lg:h-full lg:max-h-none lg:min-h-0 lg:w-[420px] lg:border-l lg:border-t-0">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">Ask this document</h2>
        <p className="mt-1 text-sm text-slate-500">{pageCount} pages</p>
      </div>
      <div
        ref={answerScrollRef}
        className="min-h-0 flex-1 touch-pan-y space-y-4 overflow-y-auto px-4 py-4 [overflow-anchor:none]"
      >
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
                <AssistantAnswer
                  text={message.text}
                  citations={message.citations}
                  activePassageId={activePassageId}
                  onSelectCitation={onSelectCitation}
                />
              </li>
            ),
          )}
        </ol>
      </div>
      <QuestionField value={draft} onChange={onDraft} onSubmit={onSubmit} />
    </aside>
  );
}

function clampPage(page: number | undefined, pageCount: number): number | undefined {
  if (!page || !Number.isFinite(page)) return undefined;
  if (page < 1 || page > pageCount) return undefined;
  return page;
}

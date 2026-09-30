"use client";

import { CopyTextButton } from "@/components/CopyTextButton";
import { CitationChip } from "@/components/workspace/CitationChip";
import type { Citation } from "@/lib/document-types";

export function AnswerBlock({ text }: { text: string }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Answer
        </p>
        <CopyTextButton text={text} label="Copy answer" />
      </div>
      <p className="mt-1 select-text">{text}</p>
    </>
  );
}

export function AssistantAnswer({
  text,
  citations,
  activePassageId,
  onSelectCitation,
}: {
  text: string;
  citations: Citation[];
  activePassageId: string | null;
  onSelectCitation: (citation: Citation) => void;
}) {
  const excerpt =
    citations.find((citation) => citation.passageId === activePassageId) ??
    citations[0];

  return (
    <article className="rounded-xl border border-slate-200 p-3 text-sm leading-relaxed text-slate-800">
      <AnswerBlock text={text} />
      {excerpt ? (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-500">Sources</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Sources">
            {citations.map((citation) => (
              <CitationChip
                key={citation.passageId}
                page={citation.page}
                section={citation.label}
                active={citation.passageId === activePassageId}
                onSelect={() => onSelectCitation(citation)}
              />
            ))}
          </div>
          <CitationExcerpt page={excerpt.page} quote={excerpt.quote} section={excerpt.label} />
        </div>
      ) : null}
    </article>
  );
}

export function CitationExcerpt({
  page,
  quote,
  section,
}: {
  page: number;
  quote: string;
  section?: string;
}) {
  const heading = section?.trim();
  return (
    <blockquote className="mt-3 border-l-4 border-[#4f46e5] bg-[#f5f4ff] px-3 py-2 text-sm text-slate-800">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[#3730a3]">
          {heading ? heading : `Passage · Page ${page}`}
        </p>
        <CopyTextButton text={quote} label="Copy passage" />
      </div>
      <p className="mt-1 select-text">{quote}</p>
    </blockquote>
  );
}

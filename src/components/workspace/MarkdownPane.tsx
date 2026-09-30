"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { parseMarkdownSections } from "@/lib/markdown/sections";
import { useContainedScroll } from "@/components/workspace/scroll-contain";
import {
  findExcerptInRoot,
  scrollOffsetForText,
  scrollOffsetWithin,
  scrollPane,
} from "@/components/workspace/scroll-passage";

export function MarkdownPane({
  fileUrl,
  section,
  source,
  focusKey = 0,
  heading,
  excerpt,
}: {
  fileUrl: string;
  section: number;
  source?: string | null;
  /** Changes when a citation should move the pane, even if the section number did not. */
  focusKey?: number;
  heading?: string;
  excerpt?: string;
}) {
  const [text, setText] = useState<string | null>(source ?? null);
  const [error, setError] = useState<string | null>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  useContainedScroll(paneRef);
  const scrolledSection = useRef<string | null>(null);

  useEffect(() => {
    if (source) {
      setText(source);
      setError(null);
      return;
    }
    const controller = new AbortController();
    setText(null);
    setError(null);
    void fetch(fileUrl, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("unavailable");
        const body = await response.text();
        if (!body.trim()) throw new Error("empty");
        setText(body);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setError("This note could not be displayed.");
      });
    return () => controller.abort();
  }, [fileUrl, source]);

  const sections = text ? parseMarkdownSections(text) : [];
  const active = sections.some((item) => item.index === section) ? section : sections[0]?.index ?? 1;

  useLayoutEffect(() => {
    if (!text) return;
    const pane = paneRef.current;
    if (!pane) return;
    const article = articleForCitation(pane, active, heading);
    if (!article) return;
    const signature = `${focusKey}:${active}:${heading ?? ""}:${excerpt ?? ""}`;
    const opening = focusKey === 0 && scrolledSection.current === null && active <= 1;
    if (!opening && scrolledSection.current === signature) return;
    scrolledSection.current = signature;
    if (opening) return;
    const located = excerpt ? findExcerptInRoot(article, excerpt) : null;
    const top = located
      ? scrollOffsetForText(pane, located.node, located.offset)
      : scrollOffsetWithin(pane, article);
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollPane(pane, top, reduce ? "auto" : "smooth");
  }, [text, active, focusKey, heading, excerpt]);

  return (
    <div className="flex h-[50dvh] max-h-[50dvh] w-full min-w-0 max-w-full shrink-0 flex-col overflow-hidden lg:h-full lg:max-h-none lg:min-h-0 lg:flex-1">
      <div
        id="pdf-scroll"
        ref={paneRef}
        className="h-0 min-h-0 w-full min-w-0 max-w-full flex-1 contain-paint touch-pan-y overflow-x-hidden overflow-y-auto bg-[#eef0f3] px-3 py-3 [overflow-anchor:none] sm:px-6 sm:py-4"
      >
        {error ? (
          <p className="mx-auto max-w-md rounded-xl bg-white p-6 text-sm text-slate-600" role="alert">
            {error}
          </p>
        ) : sections.length === 0 ? (
          <p className="text-sm text-slate-600">Loading document...</p>
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
            {sections.map((item) => {
              const body = item.text.startsWith(item.heading)
                ? item.text.slice(item.heading.length).trim()
                : item.text;
              const selected = item.index === active;
              return (
                <article
                  key={item.index}
                  id={`md-section-${item.index}`}
                  data-md-heading={item.heading}
                  className={[
                    "rounded-xl border bg-white px-4 py-4 text-sm leading-relaxed text-slate-800 shadow-sm",
                    selected ? "border-[#c7c9f5]" : "border-slate-200",
                  ].join(" ")}
                >
                  <h2 className="text-base font-semibold text-slate-950">{item.heading}</h2>
                  {body ? (
                    <p className="mt-3 whitespace-pre-wrap text-slate-700">{body}</p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function articleForCitation(
  pane: HTMLElement,
  section: number,
  heading: string | undefined,
): HTMLElement | null {
  if (heading) {
    for (const article of pane.querySelectorAll("article")) {
      if (article.getAttribute("data-md-heading") === heading) return article;
    }
  }
  const byIndex = document.getElementById(`md-section-${section}`);
  return byIndex instanceof HTMLElement ? byIndex : null;
}

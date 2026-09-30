"use client";

import { useEffect, useRef, useState } from "react";
import { parseMarkdownSections } from "@/lib/markdown/sections";
import { useContainedScroll } from "@/components/workspace/scroll-contain";

export function MarkdownPane({
  fileUrl,
  section,
  source,
}: {
  fileUrl: string;
  section: number;
  source?: string | null;
}) {
  const [text, setText] = useState<string | null>(source ?? null);
  const [error, setError] = useState<string | null>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  useContainedScroll(paneRef);
  const scrolledSection = useRef<number | null>(null);

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

  useEffect(() => {
    const node = document.getElementById(`md-section-${active}`);
    if (!node || scrolledSection.current === active) return;
    const openingOnFirst = scrolledSection.current === null && active <= 1;
    scrolledSection.current = active;
    if (openingOnFirst) return;
    const pane = paneRef.current;
    if (!pane) return;
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const top = node.getBoundingClientRect().top - pane.getBoundingClientRect().top + pane.scrollTop;
    pane.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  }, [active, sections.length]);

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

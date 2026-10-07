"use client";

import { type FormEvent, type KeyboardEvent } from "react";
import { fieldClass, primaryButtonClass } from "@/components/button-styles";

export function QuestionField({
  value,
  onChange,
  onSubmit,
  disabled = false,
  pending = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  disabled?: boolean;
  pending?: boolean;
}) {
  const blocked = disabled || pending || !value.trim();

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (blocked) return;
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="sticky bottom-0 z-10 min-w-0 border-t border-slate-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <label htmlFor="question" className="sr-only">
        Ask a question about this document
      </label>
      <div className="flex items-end gap-2">
        <textarea
          id="question"
          name="question"
          rows={2}
          value={value}
          enterKeyHint="send"
          inputMode="text"
          autoComplete="off"
          disabled={disabled || pending}
          placeholder="Ask a question about this document"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          onFocus={(event) => {
            const node = event.currentTarget;
            window.setTimeout(() => {
              node.scrollIntoView({ block: "nearest", inline: "nearest" });
            }, 300);
          }}
          className={`${fieldClass} max-h-40 resize-y py-2.5`}
        />
        <button
          type="submit"
          className={`${primaryButtonClass} shrink-0 outline-none`}
          disabled={blocked}
          aria-busy={pending}
        >
          Send
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">Enter to send. Shift+Enter for a new line.</p>
    </form>
  );
}

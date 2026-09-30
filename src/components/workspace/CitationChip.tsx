import { controlFocusClass } from "@/components/button-styles";

const chipBase = [
  "inline-flex cursor-pointer items-center rounded-full border px-2.5 py-1 text-xs font-medium",
  "transition-colors duration-150 ease-out motion-reduce:transition-none",
  controlFocusClass,
].join(" ");

export function citationChipClass(active = false): string {
  return [
    chipBase,
    active
      ? "border-[#4f46e5] bg-[#eef0ff] text-[#312e81] hover:border-[#3730a3] hover:bg-[#e0e4ff] active:bg-[#d4d8fb]"
      : "border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-400 hover:bg-slate-200 active:bg-slate-300",
  ].join(" ");
}

export function CitationChip({
  page,
  onSelect,
  active = false,
  label,
  section,
}: {
  page: number;
  onSelect: (page: number) => void;
  active?: boolean;
  label?: string;
  /** Heading for a markdown source. When set, the chip does not say "page". */
  section?: string;
}) {
  const sectionName = section?.trim();
  return (
    <button
      type="button"
      className={`${citationChipClass(active)} max-w-full`}
      aria-pressed={active}
      aria-label={sectionName ? `Show source: ${sectionName}` : `Show source on page ${page}`}
      onClick={() => onSelect(page)}
    >
      <span className="truncate">{sectionName ?? label ?? `Source p. ${page}`}</span>
    </button>
  );
}

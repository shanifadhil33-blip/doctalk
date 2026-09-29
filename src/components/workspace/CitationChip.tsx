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
      ? "border-[#d4a017] bg-[#ffe08a] text-[#6b4a08] hover:border-[#c49212] hover:bg-[#ffd15a] active:bg-[#f5c14a]"
      : "border-[#e6c56a] bg-[#fff6d8] text-[#7a5410] hover:border-[#d4a017] hover:bg-[#ffe08a] active:bg-[#ffd15a]",
  ].join(" ");
}

export function CitationChip({
  page,
  onSelect,
  active = false,
  label,
}: {
  page: number;
  onSelect: (page: number) => void;
  active?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      className={citationChipClass(active)}
      aria-pressed={active}
      aria-label={`Show source on page ${page}`}
      onClick={() => onSelect(page)}
    >
      {label ?? `Source p. ${page}`}
    </button>
  );
}

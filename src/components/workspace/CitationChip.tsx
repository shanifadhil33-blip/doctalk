export function citationChipClass(active = false): string {
  return [
    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
    active
      ? "border-[#e4c56a] bg-[#ffe8a3] text-[#6b4a08]"
      : "border-[#f0dd9a] bg-[#fff6d8] text-[#7a5410] hover:bg-[#ffefbf]",
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

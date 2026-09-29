const motion =
  "transition-colors duration-150 ease-out motion-reduce:transition-none";

export const controlFocusClass =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4f46e5]";

const pointer = "cursor-pointer";

export const primaryButtonClass = [
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#4f46e5] px-3.5 text-sm font-medium text-white",
  pointer,
  motion,
  "hover:bg-[#3730a3] active:bg-[#312e81]",
  controlFocusClass,
  "disabled:cursor-not-allowed disabled:bg-[#e4e3f8] disabled:text-[#8d8bb8] disabled:hover:bg-[#e4e3f8] disabled:active:bg-[#e4e3f8]",
].join(" ");

export const secondaryButtonClass = [
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 shadow-sm",
  pointer,
  motion,
  "hover:border-slate-400 hover:bg-slate-100 active:border-slate-400 active:bg-slate-200",
  controlFocusClass,
  "disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:hover:border-slate-200 disabled:hover:bg-slate-100 disabled:active:bg-slate-100",
].join(" ");

export const iconButtonClass = [
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700",
  pointer,
  motion,
  "hover:border-slate-400 hover:bg-slate-100 active:bg-slate-200",
  controlFocusClass,
  "disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-300 disabled:hover:border-slate-200 disabled:hover:bg-slate-100 disabled:hover:text-slate-300 disabled:active:bg-slate-100",
].join(" ");

export const toolbarButtonClass = [
  "inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700",
  pointer,
  motion,
  "hover:border-slate-400 hover:bg-slate-100 active:bg-slate-200",
  controlFocusClass,
].join(" ");

export const ghostIconButtonClass = [
  "inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500",
  pointer,
  motion,
  "hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200",
  controlFocusClass,
].join(" ");

export const textButtonClass = [
  "inline-flex h-10 items-center justify-center rounded-md px-2 text-sm font-medium text-slate-700",
  pointer,
  motion,
  "hover:bg-slate-100 hover:text-slate-950 active:bg-slate-200",
  controlFocusClass,
].join(" ");

export const textLinkClass = [
  "inline-flex items-center gap-2 rounded-md px-1.5 py-1 font-medium text-slate-700",
  pointer,
  motion,
  "hover:bg-slate-100 hover:text-slate-950 active:bg-slate-200",
  controlFocusClass,
].join(" ");

export const copyButtonClass = [
  "inline-flex h-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700",
  pointer,
  motion,
  "hover:border-slate-400 hover:bg-slate-100 active:bg-slate-200",
  controlFocusClass,
].join(" ");

export const cardLinkClass = [
  "cursor-pointer border border-slate-200 bg-white",
  motion,
  "hover:border-slate-400 hover:bg-[#f8f9fb] hover:shadow-md",
  "active:border-slate-500 active:bg-slate-100",
  controlFocusClass,
].join(" ");

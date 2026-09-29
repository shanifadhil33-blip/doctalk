import { GitHubGlyph } from "@/components/icons";

export function SiteFooter() {
  return (
    <footer className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p>Built by Adhil Shanif</p>
      <a
        href="https://github.com/shanifadhil33-blip/doctalk"
        className="inline-flex items-center gap-2 font-medium text-slate-700 hover:text-slate-950"
        target="_blank"
        rel="noreferrer"
      >
        <GitHubGlyph className="h-4 w-4" />
        Source on GitHub
      </a>
    </footer>
  );
}

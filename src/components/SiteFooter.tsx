import { textLinkClass } from "@/components/button-styles";
import { GitHubGlyph } from "@/components/icons";

export function SiteFooter() {
  return (
    <footer className="site-footer flex flex-col gap-2 border-t border-slate-200 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p>Built by Adhil Shanif</p>
      <a
        href="https://github.com/shanifadhil33-blip/doctalk"
        className={textLinkClass}
        target="_blank"
        rel="noreferrer"
      >
        <GitHubGlyph className="h-4 w-4" />
        Source on GitHub
      </a>
    </footer>
  );
}

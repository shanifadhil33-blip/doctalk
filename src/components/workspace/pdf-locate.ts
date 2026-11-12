/** Letters and digits only, so spacing, punctuation and bullet glyphs never block a match. */
export function matchKey(text: string): string {
  return text.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Finds a cited passage among the text spans of one PDF page.
 * Returns the first and last span index that the passage covers, or null.
 * It tries the start of the passage first, then skips a few words in case the
 * passage begins partway through a line the page splits differently.
 */
export function locatePassage(
  spanTexts: readonly string[],
  passage: string,
): { first: number; last: number } | null {
  let combined = "";
  const owner: number[] = [];
  spanTexts.forEach((text, index) => {
    const key = matchKey(text);
    combined += key;
    for (let i = 0; i < key.length; i += 1) owner.push(index);
  });
  if (!combined) return null;

  const words = passage.replace(/\.\.\.$/, "").split(/\s+/).filter(Boolean);
  for (let skip = 0; skip < Math.min(6, words.length); skip += 1) {
    const target = matchKey(words.slice(skip).join(" "));
    for (const length of [48, 28, 16]) {
      const needle = target.slice(0, length);
      if (needle.length < Math.min(12, length)) continue;
      const at = combined.indexOf(needle);
      if (at < 0) continue;
      const end = Math.min(combined.length, at + Math.max(needle.length, target.length)) - 1;
      const first = owner[at];
      const last = owner[end];
      if (first === undefined || last === undefined) continue;
      return { first, last };
    }
  }
  return null;
}

/** A readable name for a stored file: no extension, spaces instead of underscores. */
export function documentDisplayName(fileName: string): string {
  const base = fileName.replace(/\.(pdf|markdown|md)$/i, "");
  const spaced = base.replace(/_+/g, " ").replace(/\s+/g, " ").trim();
  return spaced || fileName;
}

const REDIRECT_STATUS = new Set([303, 307, 308]);

function hasRedirectDigest(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("digest" in error)) return false;
  const digest = error.digest;
  if (typeof digest !== "string") return false;
  const parts = digest.split(";");
  const code = parts[0];
  const type = parts[1];
  const status = Number(parts.at(-2));
  const destination = parts.slice(2, -2).join(";");
  return (
    code === "NEXT_REDIRECT" &&
    (type === "push" || type === "replace") &&
    destination.length > 0 &&
    REDIRECT_STATUS.has(status)
  );
}

/** Same shape Next.js uses for `redirect()` (`NEXT_REDIRECT` digest), including `error.cause`. */
export function isNextRedirect(error: unknown): boolean {
  if (hasRedirectDigest(error)) return true;
  if (typeof error === "object" && error !== null && "cause" in error) {
    return hasRedirectDigest(error.cause);
  }
  return false;
}

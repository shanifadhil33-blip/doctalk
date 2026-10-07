/**
 * Signed-in screens for local browser checks. Off on Vercel and unless
 * DOCTALK_SIGNED_IN_PREVIEW=1, so production never serves the fixture.
 */
export function signedInPreviewEnabled(): boolean {
  return process.env.DOCTALK_SIGNED_IN_PREVIEW === "1" && process.env.VERCEL !== "1";
}

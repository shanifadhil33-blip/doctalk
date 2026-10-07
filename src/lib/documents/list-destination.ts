/** Signed-in documents live on the home screen, which has the one upload box. */
export function ownDocumentsHref(): "/" {
  return "/";
}

/** /documents is the public demo, unless a signed-in viewer is sent home. */
export function backToDocumentsHref(signedIn: boolean): string {
  return signedIn ? ownDocumentsHref() : "/documents";
}

export function shouldRedirectSignedInDocuments(signedIn: boolean, demo: string | undefined): boolean {
  return signedIn && demo !== "1";
}

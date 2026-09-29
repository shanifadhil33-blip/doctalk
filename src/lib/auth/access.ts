import {
  isDocumentVisible,
  type DocumentVisibility,
} from "@/lib/documents/visibility";

export type PathKind =
  | { kind: "public" }
  | { kind: "protected" }
  | { kind: "document"; documentId: string };

export type FoundDocument = DocumentVisibility & {
  fileName: string;
};

export type DocumentLookup =
  | { status: "found"; document: FoundDocument }
  | { status: "missing" }
  | { status: "unavailable" };

export type AccessDecision = "allow" | "sign-in" | "not-found";

function normalizePath(pathname: string): string {
  const path = pathname.split("?")[0] ?? pathname;
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

export function classifyPath(pathname: string): PathKind {
  const path = normalizePath(pathname);

  if (
    path === "/" ||
    path === "/documents" ||
    path === "/sign-in" ||
    path.startsWith("/sign-in/") ||
    path === "/api/auth" ||
    path.startsWith("/api/auth/")
  ) {
    return { kind: "public" };
  }

  const documentMatch = /^\/documents\/([^/]+)$/.exec(path);
  const documentId = documentMatch?.[1];
  if (documentId) {
    return { kind: "document", documentId };
  }

  return { kind: "protected" };
}

export function decideProtectedAccess(
  viewerUserId: string | null,
): AccessDecision {
  return viewerUserId ? "allow" : "sign-in";
}

/**
 * Demo and null-owner documents are public. Private documents require the
 * matching viewer. A failed lookup fails closed.
 */
export function decideDocumentAccess(
  viewerUserId: string | null,
  lookup: DocumentLookup,
): AccessDecision {
  if (lookup.status !== "found") {
    return viewerUserId ? "not-found" : "sign-in";
  }

  if (isDocumentVisible(lookup.document, viewerUserId)) {
    return "allow";
  }

  return viewerUserId ? "not-found" : "sign-in";
}

/** Relative in-app paths only, so the sign-in redirect cannot leave the site. */
export function safeCallbackPath(value: string | undefined): string {
  if (!value) {
    return "/";
  }
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/";
  }
  if (value.includes("://")) {
    return "/";
  }
  return value;
}

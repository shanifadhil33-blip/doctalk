import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  classifyPath,
  decideDocumentAccess,
  decideProtectedAccess,
} from "@/lib/auth/access";
import { userIdFromTokenSub } from "@/lib/auth/user-id";
import { isOfflineSampleId } from "@/lib/demo-documents";
import { lookupDocument } from "@/lib/documents/lookup";

export default auth(async (req) => {
  const viewerUserId = userIdFromTokenSub(req.auth?.user?.id);
  const kind = classifyPath(req.nextUrl.pathname);

  if (kind.kind === "public") {
    return NextResponse.next();
  }

  if (kind.kind === "protected") {
    if (decideProtectedAccess(viewerUserId) === "allow") {
      return NextResponse.next();
    }
    return redirectToSignIn(req);
  }

  if (!process.env.DATABASE_URL && isOfflineSampleId(kind.documentId)) {
    return NextResponse.next();
  }

  const decision = decideDocumentAccess(
    viewerUserId,
    await lookupDocument(kind.documentId),
  );
  if (decision === "allow") {
    return NextResponse.next();
  }
  if (decision === "sign-in") {
    return redirectToSignIn(req);
  }
  return new NextResponse(null, { status: 404 });
});

function redirectToSignIn(req: {
  url: string;
  nextUrl: { pathname: string; search: string };
}) {
  const signInUrl = new URL("/sign-in", req.url);
  signInUrl.searchParams.set(
    "callbackUrl",
    `${req.nextUrl.pathname}${req.nextUrl.search}`,
  );
  return NextResponse.redirect(signInUrl);
}

export const config = {
  // Static files in public/ must not be treated as protected routes.
  // The PDF.js worker is .mjs (the default list only skips .js). Demo PDFs
  // are .pdf. Private documents are streamed from /api/documents/:id/file.
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|mjs|pdf|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

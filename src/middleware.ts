import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  classifyPath,
  decideDocumentAccess,
  decideProtectedAccess,
} from "@/lib/auth/access";
import { userIdFromTokenSub } from "@/lib/auth/user-id";
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
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

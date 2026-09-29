import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { decideDocumentAccess } from "@/lib/auth/access";
import { userIdFromTokenSub } from "@/lib/auth/user-id";
import { lookupDocument } from "@/lib/documents/lookup";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  const viewerUserId = userIdFromTokenSub(session?.user?.id);
  const lookup = await lookupDocument(id);
  const decision = decideDocumentAccess(viewerUserId, lookup);
  if (decision === "sign-in") {
    return Response.json({ error: "Sign in required" }, { status: 401 });
  }
  if (decision !== "allow" || lookup.status !== "found" || !lookup.document.fileUrl) {
    return Response.json({ error: "Document not found" }, { status: 404 });
  }

  const fileUrl = lookup.document.fileUrl;
  if (fileUrl.startsWith("/") && !fileUrl.startsWith("//")) {
    return NextResponse.redirect(new URL(fileUrl, req.url));
  }

  const upstream = await fetch(fileUrl);
  if (!upstream.ok || !upstream.body) {
    return Response.json({ error: "File is unavailable" }, { status: 502 });
  }

  const fileName = lookup.document.fileName.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName || "document.pdf"}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}

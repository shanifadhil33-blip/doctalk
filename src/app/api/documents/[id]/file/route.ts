import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { decideDocumentAccess } from "@/lib/auth/access";
import { userIdFromTokenSub } from "@/lib/auth/user-id";
import { classifyStoredFileUrl } from "@/lib/documents/blob-url";
import { lookupDocument } from "@/lib/documents/lookup";
import { isMarkdownFileName } from "@/lib/markdown/sections";

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
  const kind = classifyStoredFileUrl(fileUrl);
  if (kind === "local") {
    return NextResponse.redirect(new URL(fileUrl, req.url));
  }

  const fileName = lookup.document.fileName.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
  const markdown = isMarkdownFileName(lookup.document.fileName);
  const headers = {
    "Content-Type": markdown ? "text/markdown; charset=utf-8" : "application/pdf",
    "Content-Disposition": `inline; filename="${fileName || (markdown ? "document.md" : "document.pdf")}"`,
    "Cache-Control": "private, max-age=60",
    "X-Content-Type-Options": "nosniff",
  };

  if (kind === "private-blob") {
    const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
    if (!token) {
      return Response.json({ error: "File storage is not configured." }, { status: 503 });
    }
    const result = await get(fileUrl, { access: "private", token });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return Response.json({ error: "File is unavailable" }, { status: 502 });
    }
    return new Response(result.stream, { headers });
  }

  if (kind === "public-blob") {
    const upstream = await fetch(fileUrl);
    if (!upstream.ok || !upstream.body) {
      return Response.json({ error: "File is unavailable" }, { status: 502 });
    }
    return new Response(upstream.body, { headers });
  }

  return Response.json({ error: "Document not found" }, { status: 404 });
}

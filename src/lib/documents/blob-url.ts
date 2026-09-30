const PRIVATE_HOST_SUFFIX = ".private.blob.vercel-storage.com";
const PUBLIC_HOST_SUFFIX = ".public.blob.vercel-storage.com";

const UPLOAD_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type StoredFileKind = "local" | "private-blob" | "public-blob" | "pending" | "reject";

export function isUuid(value: string): boolean {
  return UPLOAD_ID_PATTERN.test(value);
}

export function isUploadId(value: string): boolean {
  return isUuid(value);
}

export type UploadExtension = "pdf" | "md" | "markdown";

export function clientUploadPath(
  uploadId: string,
  extension: UploadExtension = "pdf",
): string {
  return `uploads/${uploadId}.${extension}`;
}

export function pathnameMatchesUpload(pathname: string, uploadId: string): boolean {
  if (!isUploadId(uploadId)) return false;
  if (pathname.includes("..") || pathname.includes("\\") || pathname.includes("//")) {
    return false;
  }
  const pattern = new RegExp(
    `^uploads/${uploadId}(?:-[A-Za-z0-9_-]{1,80})?\\.(?:pdf|markdown|md)$`,
    "i",
  );
  return pattern.test(pathname);
}

export function classifyStoredFileUrl(fileUrl: string): StoredFileKind {
  if (fileUrl.startsWith("pending:")) return "pending";
  if (fileUrl.startsWith("/") && !fileUrl.startsWith("//") && !fileUrl.includes("\\")) {
    return "local";
  }
  const parsed = parseHttpsUrl(fileUrl);
  if (!parsed) return "reject";
  if (parsed.hostname.endsWith(PRIVATE_HOST_SUFFIX)) return "private-blob";
  if (parsed.hostname.endsWith(PUBLIC_HOST_SUFFIX)) return "public-blob";
  return "reject";
}

export function isRemoteBlobUrl(fileUrl: string): boolean {
  const kind = classifyStoredFileUrl(fileUrl);
  return kind === "private-blob" || kind === "public-blob";
}

/**
 * A completed private upload must use this user's pathname and a private Blob host.
 * Anything else is rejected before the server reads bytes.
 */
export function blobBelongsToUpload(input: {
  url: string;
  pathname: string;
  uploadId: string;
}): boolean {
  if (!pathnameMatchesUpload(input.pathname, input.uploadId)) return false;
  const parsed = parseHttpsUrl(input.url);
  if (!parsed) return false;
  if (!parsed.hostname.endsWith(PRIVATE_HOST_SUFFIX)) return false;
  const storeLabel = parsed.hostname.slice(0, -PRIVATE_HOST_SUFFIX.length);
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(storeLabel)) return false;
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(parsed.pathname);
  } catch {
    return false;
  }
  return decodedPath === `/${input.pathname}`;
}

function parseHttpsUrl(value: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  if (parsed.username || parsed.password || parsed.port) return null;
  return parsed;
}

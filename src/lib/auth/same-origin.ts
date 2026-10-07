function requestHost(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-host");
  const host = (forwarded ?? request.headers.get("host") ?? "").split(",")[0]?.trim() ?? "";
  return host.length > 0 ? host : null;
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = requestHost(request);
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

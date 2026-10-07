const storageKey = "doctalk.navFrom";

export function rememberNavFrom(pathname: string, search: string): void {
  if (pathname === "/settings" || pathname === "/sign-in") return;
  if (pathname !== "/" && pathname !== "/documents" && !pathname.startsWith("/documents/")) return;
  try {
    sessionStorage.setItem(storageKey, `${pathname}${search}`);
  } catch {
    // Private browsing can block storage. Back still has a home fallback.
  }
}

export function readNavFrom(): { href: string; label: string } {
  let raw = "";
  try {
    raw = sessionStorage.getItem(storageKey) ?? "";
  } catch {
    raw = "";
  }
  const path = raw.split("?")[0] ?? "";
  if (path === "/documents") return { href: raw || "/documents", label: "Documents" };
  if (path.startsWith("/documents/") && !path.includes("//")) {
    return { href: path, label: "Document" };
  }
  return { href: "/", label: "Home" };
}

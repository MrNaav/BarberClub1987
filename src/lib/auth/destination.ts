/** Accept only exact admin roots/children and the current origin. */
export function safeAdminDestination(value: string | undefined, origin: string): string {
  if (!value) return "/admin";
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin || !(url.pathname === "/admin" || url.pathname.startsWith("/admin/"))) return "/admin";
    return url.pathname + url.search;
  } catch {
    return "/admin";
  }
}
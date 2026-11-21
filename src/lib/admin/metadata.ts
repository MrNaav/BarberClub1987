/** Unique, non-indexable metadata for each administrative content page. */
export function adminHead(label: string, description: string) {
  const title = `${label} — Barber Club 1987`;
  return { meta: [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] };
}
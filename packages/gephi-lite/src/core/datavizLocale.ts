export type DatavizLocale = "ja" | "en";

export function normalizeDatavizLocale(value: unknown): DatavizLocale | null {
  const lang = String(value || "")
    .trim()
    .toLowerCase();
  if (lang === "ja" || lang.startsWith("ja-")) return "ja";
  if (lang === "en" || lang.startsWith("en-")) return "en";
  return null;
}

export function resolveDatavizLocale({
  locationRef = typeof window !== "undefined" ? window.location : null,
  documentRef = typeof document !== "undefined" ? document : null,
  navigatorRef = typeof navigator !== "undefined" ? navigator : null,
}: {
  locationRef?: Location | { href?: string } | string | null;
  documentRef?: Document | { cookie?: string; documentElement?: { lang?: string } } | null;
  navigatorRef?: Navigator | { language?: string; userLanguage?: string } | null;
} = {}): DatavizLocale {
  const sharedWindow =
    typeof window !== "undefined"
      ? (window as Window & { DatavizLocale?: { resolve?: () => string } })
      : null;
  const sharedLocale = normalizeDatavizLocale(sharedWindow?.DatavizLocale?.resolve?.());
  if (sharedLocale) return sharedLocale;

  try {
    const href = typeof locationRef === "string" ? locationRef : locationRef?.href || "";
    const url = new URL(href);
    const langParam = normalizeDatavizLocale(url.searchParams.get("lang"));
    if (langParam) return langParam;
    if (url.pathname === "/en" || url.pathname.startsWith("/en/")) return "en";
  } catch (_error) {
    // ignore
  }

  try {
    const raw = String(documentRef?.cookie || "")
      .split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("locale="));
    const cookieLocale = raw ? normalizeDatavizLocale(decodeURIComponent(raw.slice("locale=".length))) : null;
    if (cookieLocale) return cookieLocale;
  } catch (_error) {
    // ignore
  }

  const htmlLocale = normalizeDatavizLocale(documentRef?.documentElement?.lang);
  if (htmlLocale) return htmlLocale;

  const nav = navigatorRef as { language?: string; userLanguage?: string } | null;
  const browserLocale = normalizeDatavizLocale(nav?.language || nav?.userLanguage);
  return browserLocale || "ja";
}

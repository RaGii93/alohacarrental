const TERMS_PDF_BY_LOCALE: Record<string, string> = {
  en: "/terms-en.pdf",
  es: "/terms-es.pdf",
  nl: "/terms-nl.pdf",
};

export function getLocalizedTermsPdfUrl(locale: string | null | undefined, fallbackUrl?: string | null): string {
  const normalizedLocale = String(locale || "").trim().toLowerCase().split("-")[0];
  return TERMS_PDF_BY_LOCALE[normalizedLocale] || String(fallbackUrl || "/terms-en.pdf");
}

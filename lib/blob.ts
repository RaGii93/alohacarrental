function getAppBaseUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    "";

  if (!envUrl) return "";
  return (envUrl.startsWith("http") ? envUrl : `https://${envUrl}`).replace(/\/+$/, "");
}

export function toAbsoluteAppUrl(url?: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;

  const baseUrl = getAppBaseUrl();
  if (!baseUrl) return url;

  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

export function getInlineBlobUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("download");
    return parsed.toString();
  } catch {
    return url;
  }
}

export function isPdfUrl(url?: string | null): boolean {
  if (!url) return false;
  return url.toLowerCase().includes(".pdf");
}

export function getBlobProxyUrl(
  sourceUrl?: string | null,
  options?: { download?: boolean; absolute?: boolean }
): string | null {
  if (!sourceUrl) return null;

  const result = sourceUrl.startsWith("/")
    ? `${sourceUrl}${options?.download ? `${sourceUrl.includes("?") ? "&" : "?"}download=1` : ""}`
    : (() => {
        const params = new URLSearchParams();
        params.set("src", sourceUrl);
        if (options?.download) params.set("download", "1");
        return `/api/blob/file?${params.toString()}`;
      })();

  return options?.absolute ? toAbsoluteAppUrl(result) || result : result;
}

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

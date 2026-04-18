import { routing } from "@/i18n/routing";

export function toLocalePath(locale: string, path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const normalizedPath = cleanPath === "/" ? "" : cleanPath;
  return locale === routing.defaultLocale ? normalizedPath || "/" : `/${locale}${normalizedPath}`;
}

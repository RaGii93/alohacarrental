import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { toLocalePath as buildLocalePath } from "@/lib/locale-paths";
import { getProfileDefaultDescription } from "@/lib/public-metadata-profiles";
import { getDetectedLogoPath } from "@/lib/site-assets";
import type { TenantConfig } from "@/lib/tenant";

export const allKeywords = [
  "car rental",
  "car hire",
  "rental car",
  "vehicle rental",
  "airport pickup",
  "daily car rental",
  "weekly car rental",
  "long term rental",
  "economy car rental",
  "suv rental",
  "family car rental",
  "premium car rental",
  "Bonaire car rental",
  "Bonaire car hire",
  "Kralendijk car rental",
  "Flamingo Airport car rental",
  "Bonaire airport car rental",
  "Caribbean Netherlands car rental",
  "Bonaire vehicle rental",
  "Bonaire rental cars",
  "car rental Bonaire",
  "rent a car Bonaire",
  "transparent pricing",
  "online booking",
  "trusted car rental support",
  "island car rental",
] as const;

export const DEFAULT_PUBLIC_BASE_URL = "https://www.alohacarrentalbonaire.com";
export const PUBLIC_INDEXABLE_PATHS = ["/", "/book", "/fleet", "/faq", "/security"] as const;
export const PRIVATE_PATH_PREFIXES = [
  "/admin",
  "/dashboard",
  "/account",
  "/settings",
  "/login",
  "/book/review",
  "/book/success",
] as const;
export const PRIVATE_API_PREFIXES = [
  "/api/admin/",
  "/api/private/",
  "/api/quickbooks/",
  "/api/integrations/",
  "/api/help-assistant",
  "/api/upload/",
  "/api/cron/",
] as const;

function defaultDescriptionByLocale(locale: string, tenantName: string): string {
  return getProfileDefaultDescription("rental", locale, tenantName);
}

export function getBaseUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const host = envUrl ? (envUrl.startsWith("http") ? envUrl : `https://${envUrl}`) : DEFAULT_PUBLIC_BASE_URL;
  return host.replace(/\/+$/, "");
}

export function toLocalePath(locale: string, path: string): string {
  return buildLocalePath(locale, path);
}

export function getAbsoluteUrl(path: string): string {
  const normalized = path === "/" ? "" : path;
  return `${getBaseUrl()}${normalized}`;
}

export function getLocaleAlternates(path: string): Record<string, string> {
  const alternates = Object.fromEntries(
    routing.locales.map((locale) => [locale, toLocalePath(locale, path)])
  ) as Record<string, string>;
  alternates["x-default"] = toLocalePath(routing.defaultLocale, path);
  return alternates;
}

export function getAbsoluteLocaleAlternates(path: string): Record<string, string> {
  return Object.fromEntries(
    Object.entries(getLocaleAlternates(path)).map(([locale, localePath]) => [
      locale,
      getAbsoluteUrl(localePath),
    ])
  );
}

export function localeToLanguageTag(locale: string): string {
  if (locale === "nl") return "nl-NL";
  if (locale === "es") return "es-ES";
  return "en-US";
}

export function localeToOpenGraphLocale(locale: string): string {
  if (locale === "nl") return "nl_NL";
  if (locale === "es") return "es_ES";
  return "en_US";
}

export function getPublicLogoPath(tenant: TenantConfig): string {
  return getDetectedLogoPath(tenant.logoUrl);
}

export function buildMetadata(input: {
  locale: string;
  path: string;
  title: string;
  description?: string;
  keywords?: readonly string[];
  noIndex?: boolean;
  tenant: TenantConfig;
}): Metadata {
  const tenant = input.tenant;
  const siteName = tenant.tenantName || "Aloha Car Rental";
  const description =
    input.description ||
    defaultDescriptionByLocale(input.locale, siteName);
  const canonical = toLocalePath(input.locale, input.path);
  const absoluteUrl = getAbsoluteUrl(canonical);
  const logoPath = getPublicLogoPath(tenant);
  const logoUrl = logoPath.startsWith("http") ? logoPath : getAbsoluteUrl(logoPath);
  const iconUrl = logoPath.startsWith("http") ? logoPath : getAbsoluteUrl(logoPath);
  const robots = input.noIndex
    ? {
        index: false,
        follow: false,
        nocache: true,
        noarchive: true,
        nosnippet: true,
        googleBot: {
          index: false,
          follow: false,
          noimageindex: true,
          noarchive: true,
          nosnippet: true,
        },
      }
    : {
        index: true,
        follow: true,
      };

  return {
    metadataBase: new URL(getBaseUrl()),
    title: input.title,
    description,
    keywords: input.keywords ? [...input.keywords] : undefined,
    alternates: {
      canonical,
      languages: input.noIndex ? undefined : getLocaleAlternates(input.path),
    },
    openGraph: {
      title: input.title,
      description,
      url: absoluteUrl,
      siteName,
      type: "website",
      locale: localeToOpenGraphLocale(input.locale),
      alternateLocale: routing.locales
        .filter((locale) => locale !== input.locale)
        .map((locale) => localeToOpenGraphLocale(locale)),
      images: [{ url: logoUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description,
      images: [logoUrl],
    },
    icons: {
      icon: [{ url: iconUrl, type: "image/png" }],
      shortcut: [{ url: iconUrl, type: "image/png" }],
      apple: [{ url: iconUrl, type: "image/png" }],
    },
    robots,
  };
}

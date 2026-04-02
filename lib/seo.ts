import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { getProfileDefaultDescription } from "@/lib/public-metadata-profiles";
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
  "transparent pricing",
  "online booking",
  "trusted car rental support",
  "Curacao car rental",
  "Curacao airport car rental",
  "Willemstad car rental",
  "Caribbean car rental",
] as const;

export const DEFAULT_PUBLIC_BASE_URL = "https://www.alohacarrentalbonaire.com";

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
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const normalizedPath = cleanPath === "/" ? "" : cleanPath;
  return locale === routing.defaultLocale ? normalizedPath || "/" : `/${locale}${normalizedPath}`;
}

function languageAlternates(path: string): Record<string, string> {
  return Object.fromEntries(
    routing.locales.map((locale) => [locale, toLocalePath(locale, path)])
  );
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
  const absoluteUrl = `${getBaseUrl()}${canonical === "/" ? "" : canonical}`;
  const logoUrl = tenant.logoUrl?.startsWith("http")
    ? tenant.logoUrl
    : `${getBaseUrl()}${tenant.logoUrl || "/home/logo.png"}`;
  const iconPath = tenant.logoUrl || "/home/logo.png";
  const iconUrl = iconPath.startsWith("http")
    ? iconPath
    : `${getBaseUrl()}${iconPath}`;

  return {
    metadataBase: new URL(getBaseUrl()),
    title: input.title,
    description,
    keywords: input.keywords ? [...input.keywords] : undefined,
    alternates: {
      canonical,
      languages: languageAlternates(input.path),
    },
    openGraph: {
      title: input.title,
      description,
      url: absoluteUrl,
      siteName,
      type: "website",
      locale: input.locale,
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
    robots: input.noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
        },
  };
}

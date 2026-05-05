import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { getProfileDefaultDescription } from "@/lib/public-metadata-profiles";
import type { TenantConfig } from "@/lib/tenant";

export const allKeywords = [
  "car rental",
  "car hire",
  "rental car",
  "rent a car",
  "rent a car bonaire",
  "bonaire rent a car",
  "vehicle rental",
  "vehicle hire",
  "airport pickup",
  "airport car rental",
  "daily car rental",
  "weekly car rental",
  "monthly car rental",
  "long term rental",
  "economy car rental",
  "suv rental",
  "jeep rental",
  "4x4 rental",
  "family car rental",
  "premium car rental",
  "affordable car rental",
  "transparent pricing",
  "online booking",
  "instant booking confirmation",
  "trusted car rental support",
  "Aloha Car Rental Bonaire",
  "Bonaire car rental",
  "car rental bonaire",
  "bonaire car hire",
  "car hire bonaire",
  "bonaire vehicle rental",
  "rent a car kralendijk",
  "kralendijk rent a car",
  "Bonaire airport car rental",
  "Bonaire airport pickup",
  "flamingo airport pickup",
  "bonaire airport transfer car rental",
  "Kralendijk car rental",
  "Flamingo Airport car rental",
  "Caribbean car rental",
  "caribbean car hire",
  "caribbean vehicle rental",
  "caribbean island car rental",
  "dutch caribbean car rental",
  "abc islands car rental",
  "bonaire travel car rental",
  "island car rental",
  "Bonaire carrental",
  "Kralendijk carrental",
  "alquiler de autos",
  "alquiler de coches",
  "renta de autos",
  "renta de coches",
  "alquiler de vehiculos",
  "alquiler de autos bonaire",
  "alquiler de autos en bonaire",
  "alquiler de coches bonaire",
  "renta de autos bonaire",
  "alquiler de autos aeropuerto bonaire",
  "alquiler de autos aeropuerto flamingo",
  "alquiler de autos caribe holandes",
  "alquiler de autos islas del caribe",
  "recogida en aeropuerto",
  "reserva de autos en linea",
  "alquiler diario de autos",
  "alquiler semanal de autos",
  "alquiler mensual de autos",
  "alquiler de suv",
  "alquiler de autos caribe",
  "autoverhuur",
  "auto huren",
  "huurauto",
  "autohuur",
  "autoverhuur bonaire",
  "auto huren bonaire",
  "huurauto bonaire",
  "autohuur bonaire",
  "auto huren kralendijk",
  "autoverhuur luchthaven bonaire",
  "autoverhuur caribisch gebied",
  "autoverhuur nederlandse cariben",
  "huurauto flamingo airport",
  "luchthaven pickup",
  "online auto reserveren",
  "dagelijkse autohuur",
  "wekelijkse autohuur",
  "maandelijkse autohuur",
  "langetermijn autohuur",
  "suv huren",
  "autoverhuur cariben",
] as const;

function defaultDescriptionByLocale(locale: string, tenantName: string): string {
  return getProfileDefaultDescription("rental", locale, tenantName);
}

export function getBaseUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const host = envUrl ? (envUrl.startsWith("http") ? envUrl : `https://${envUrl}`) : "http://localhost:3000";
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
  const baseUrl = getBaseUrl();
  const siteName = tenant.tenantName || "Bon Drive Car Rental";
  const description =
    input.description ||
    defaultDescriptionByLocale(input.locale, siteName);
  const canonical = toLocalePath(input.locale, input.path);
  const absoluteUrl = `${baseUrl}${canonical === "/" ? "" : canonical}`;
  const metadataLogoUrl = `${baseUrl}/images/Logo.png?v=2026-05-04`;
  return {
    metadataBase: new URL(baseUrl),
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
      images: [{ url: metadataLogoUrl, width: 1200, height: 630, alt: siteName }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description,
      images: [metadataLogoUrl],
    },
    icons: {
      icon: [
        { url: metadataLogoUrl },
      ],
      shortcut: [
        { url: metadataLogoUrl },
      ],
      apple: [
        { url: metadataLogoUrl },
      ],
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

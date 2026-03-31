import { DEFAULT_PUBLIC_PROFILE, type PublicProfile } from "@/lib/deployment-profiles";
import type { TenantConfig } from "@/lib/tenant";
import { getBaseUrl, toLocalePath } from "@/lib/seo";

function localeToLanguageTag(locale: string): string {
  if (locale === "nl") return "nl-NL";
  if (locale === "es") return "es-ES";
  return "en-US";
}

function parseCoordinates(address?: string): { latitude?: number; longitude?: number } {
  if (!address) return {};
  const match = address.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (!match) return {};
  return { latitude: Number(match[1]), longitude: Number(match[2]) };
}

function getRentalHomeJsonLd(locale: string, tenant: TenantConfig) {
  const baseUrl = getBaseUrl();
  const homeUrl = `${baseUrl}${toLocalePath(locale, "/") === "/" ? "" : toLocalePath(locale, "/")}`;
  const bookUrl = `${baseUrl}${toLocalePath(locale, "/book")}`;
  const lang = localeToLanguageTag(locale);
  const coords = parseCoordinates(tenant.address);

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: tenant.tenantName,
    url: homeUrl,
    logo: tenant.logoUrl?.startsWith("http") ? tenant.logoUrl : `${baseUrl}${tenant.logoUrl}`,
    email: tenant.email,
    telephone: tenant.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: tenant.address,
    },
  };

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "AutoRental",
    "@id": `${baseUrl}/#business`,
    name: tenant.tenantName,
    url: homeUrl,
    email: tenant.email,
    telephone: tenant.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: tenant.address,
    },
    ...(coords.latitude && coords.longitude
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: coords.latitude,
            longitude: coords.longitude,
          },
        }
      : {}),
    areaServed: "Caribbean",
    priceRange: "$$",
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    name: tenant.tenantName,
    url: homeUrl,
    inLanguage: lang,
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}${toLocalePath(locale, "/book/review")}?code={booking_code}`,
      "query-input": "required name=booking_code",
    },
  };

  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Vehicle Rental",
    provider: {
      "@type": "Organization",
      name: tenant.tenantName,
      url: homeUrl,
    },
    areaServed: "Caribbean",
    offers: {
      "@type": "Offer",
      priceCurrency: tenant.currency,
      url: bookUrl,
      availability: "https://schema.org/InStock",
    },
  };

  return [organization, localBusiness, website, service];
}

function getSaasHomeJsonLd(locale: string, tenant: TenantConfig) {
  const baseUrl = getBaseUrl();
  const homeUrl = `${baseUrl}${toLocalePath(locale, "/") === "/" ? "" : toLocalePath(locale, "/")}`;
  const lang = localeToLanguageTag(locale);
  const sameAs = [
    tenant.facebookUrl,
    tenant.instagramUrl,
    tenant.linkedinUrl,
    tenant.tiktokUrl,
    tenant.whatsappUrl,
  ].filter(Boolean);

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: tenant.tenantName,
    url: homeUrl,
    logo: tenant.logoUrl?.startsWith("http") ? tenant.logoUrl : `${baseUrl}${tenant.logoUrl}`,
    email: tenant.email,
    telephone: tenant.phone,
    areaServed: "Caribbean",
    sameAs: sameAs.length ? sameAs : undefined,
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    name: tenant.tenantName,
    url: homeUrl,
    inLanguage: lang,
  };

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${baseUrl}/#software`,
    name: tenant.tenantName,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Car Rental Software",
    operatingSystem: "Web",
    url: homeUrl,
    description: `${tenant.tenantName} is car rental SaaS for Caribbean operators with online booking, fleet management, pickup and return tracking, and billing integrations.`,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      url: homeUrl,
    },
    provider: {
      "@id": `${baseUrl}/#organization`,
    },
    areaServed: "Caribbean",
    availableLanguage: ["en", "es", "nl"],
  };

  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${baseUrl}/#service`,
    serviceType: "Car Rental Management Software",
    name: `${tenant.tenantName} Car Rental Platform`,
    provider: {
      "@id": `${baseUrl}/#organization`,
    },
    audience: {
      "@type": "Audience",
      audienceType: "Car rental operators",
    },
    areaServed: "Caribbean",
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      url: homeUrl,
      availability: "https://schema.org/InStock",
    },
  };

  return [organization, website, software, service];
}

export function getHomeJsonLd(
  locale: string,
  tenant: TenantConfig,
  profile: PublicProfile = DEFAULT_PUBLIC_PROFILE,
) {
  return profile === "saas" ? getSaasHomeJsonLd(locale, tenant) : getRentalHomeJsonLd(locale, tenant);
}

export function getBookingJsonLd(locale: string, tenant: TenantConfig) {
  const baseUrl = getBaseUrl();
  const pageUrl = `${baseUrl}${toLocalePath(locale, "/book")}`;
  const lang = localeToLanguageTag(locale);

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${tenant.tenantName} Booking`,
      url: pageUrl,
      inLanguage: lang,
      isPartOf: {
        "@type": "WebSite",
        name: tenant.tenantName,
        url: `${baseUrl}${toLocalePath(locale, "/") === "/" ? "" : toLocalePath(locale, "/")}`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      serviceType: "Car Rental Booking",
      provider: {
        "@type": "Organization",
        name: tenant.tenantName,
      },
      offers: {
        "@type": "Offer",
        priceCurrency: tenant.currency,
        url: pageUrl,
      },
    },
  ];
}

import { getTenantConfig } from "@/lib/tenant";
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

export function getHomeJsonLd(locale: string) {
  const tenant = getTenantConfig();
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

export function getBookingJsonLd(locale: string) {
  const tenant = getTenantConfig();
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


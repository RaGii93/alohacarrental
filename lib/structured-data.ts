import { DEFAULT_PUBLIC_PROFILE, type PublicProfile } from "@/lib/deployment-profiles";
import {
  getAbsoluteLocaleAlternates,
  getAbsoluteUrl,
  getBaseUrl,
  getPublicLogoPath,
  localeToLanguageTag,
  toLocalePath,
} from "@/lib/seo";
import type { TenantConfig } from "@/lib/tenant";

type BreadcrumbItem = {
  name: string;
  path: string;
};

type FaqSchemaItem = {
  question: string;
  answer: string;
};

function parseCoordinates(address?: string): { latitude?: number; longitude?: number } {
  if (!address) return {};
  const match = address.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (!match) return {};
  return { latitude: Number(match[1]), longitude: Number(match[2]) };
}

function getHomeUrl(locale: string) {
  return getAbsoluteUrl(toLocalePath(locale, "/"));
}

function getLogoUrl(tenant: TenantConfig) {
  const logoPath = getPublicLogoPath(tenant);
  return logoPath.startsWith("http") ? logoPath : getAbsoluteUrl(logoPath);
}

function getSameAs(tenant: TenantConfig) {
  return [
    tenant.facebookUrl,
    tenant.instagramUrl,
    tenant.linkedinUrl,
    tenant.tiktokUrl,
    tenant.whatsappUrl,
  ].filter(Boolean);
}

function getOrganizationNode(locale: string, tenant: TenantConfig) {
  const baseUrl = getBaseUrl();
  const sameAs = getSameAs(tenant);

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: tenant.tenantName,
    url: getHomeUrl(locale),
    logo: getLogoUrl(tenant),
    email: tenant.email,
    telephone: tenant.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: tenant.address,
      addressLocality: "Kralendijk",
      addressCountry: "BQ",
    },
    sameAs: sameAs.length ? sameAs : undefined,
  };
}

function getLocalBusinessNode(locale: string, tenant: TenantConfig) {
  const baseUrl = getBaseUrl();
  const coords = parseCoordinates(tenant.address);

  return {
    "@context": "https://schema.org",
    "@type": "AutoRental",
    "@id": `${baseUrl}/#business`,
    name: tenant.tenantName,
    url: getHomeUrl(locale),
    image: getLogoUrl(tenant),
    logo: getLogoUrl(tenant),
    email: tenant.email,
    telephone: tenant.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: tenant.address,
      addressLocality: "Kralendijk",
      addressCountry: "BQ",
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
    areaServed: {
      "@type": "AdministrativeArea",
      name: "Bonaire",
    },
    priceRange: "$$",
    currenciesAccepted: tenant.currency,
  };
}

function getWebsiteNode(locale: string, tenant: TenantConfig) {
  const baseUrl = getBaseUrl();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    name: tenant.tenantName,
    url: getHomeUrl(locale),
    inLanguage: localeToLanguageTag(locale),
  };
}

export function getBreadcrumbJsonLd(locale: string, items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: getAbsoluteUrl(toLocalePath(locale, item.path)),
    })),
  };
}

export function getWebPageJsonLd(input: {
  locale: string;
  path: string;
  name: string;
  description?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.name,
    description: input.description,
    url: getAbsoluteUrl(toLocalePath(input.locale, input.path)),
    inLanguage: localeToLanguageTag(input.locale),
    isPartOf: {
      "@id": `${getBaseUrl()}/#website`,
    },
  };
}

function getRentalHomeJsonLd(locale: string, tenant: TenantConfig) {
  const bookUrl = getAbsoluteUrl(toLocalePath(locale, "/book"));

  return [
    getOrganizationNode(locale, tenant),
    getLocalBusinessNode(locale, tenant),
    getWebsiteNode(locale, tenant),
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${getBaseUrl()}/#service`,
      serviceType: "Car rental",
      provider: {
        "@id": `${getBaseUrl()}/#organization`,
      },
      areaServed: {
        "@type": "AdministrativeArea",
        name: "Bonaire",
      },
      offers: {
        "@type": "Offer",
        priceCurrency: tenant.currency,
        url: bookUrl,
        availability: "https://schema.org/InStock",
      },
    },
  ];
}

function getSaasHomeJsonLd(locale: string, tenant: TenantConfig) {
  return [
    getOrganizationNode(locale, tenant),
    getWebsiteNode(locale, tenant),
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": `${getBaseUrl()}/#software`,
      name: tenant.tenantName,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Car Rental Software",
      operatingSystem: "Web",
      url: getHomeUrl(locale),
      description: `${tenant.tenantName} is car rental SaaS for Caribbean operators with online booking, fleet management, pickup and return tracking, and billing integrations.`,
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        url: getHomeUrl(locale),
      },
      provider: {
        "@id": `${getBaseUrl()}/#organization`,
      },
      areaServed: "Caribbean",
      availableLanguage: ["en", "es", "nl"],
    },
  ];
}

export function getHomeJsonLd(
  locale: string,
  tenant: TenantConfig,
  profile: PublicProfile = DEFAULT_PUBLIC_PROFILE,
) {
  return profile === "saas" ? getSaasHomeJsonLd(locale, tenant) : getRentalHomeJsonLd(locale, tenant);
}

export function getBookingJsonLd(input: {
  locale: string;
  tenant: TenantConfig;
  pageName: string;
  description?: string;
}) {
  const pageUrl = getAbsoluteUrl(toLocalePath(input.locale, "/book"));

  return [
    getWebPageJsonLd({
      locale: input.locale,
      path: "/book",
      name: input.pageName,
      description: input.description,
    }),
    getBreadcrumbJsonLd(input.locale, [
      { name: input.tenant.tenantName, path: "/" },
      { name: input.pageName, path: "/book" },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "Service",
      serviceType: "Car rental booking",
      provider: {
        "@id": `${getBaseUrl()}/#organization`,
      },
      areaServed: {
        "@type": "AdministrativeArea",
        name: "Bonaire",
      },
      offers: {
        "@type": "Offer",
        priceCurrency: input.tenant.currency,
        url: pageUrl,
      },
      availableChannel: {
        "@type": "ServiceChannel",
        serviceUrl: pageUrl,
      },
    },
  ];
}

export function getSimplePageJsonLd(input: {
  locale: string;
  tenant: TenantConfig;
  path: string;
  name: string;
  description?: string;
}) {
  return [
    getWebPageJsonLd({
      locale: input.locale,
      path: input.path,
      name: input.name,
      description: input.description,
    }),
    getBreadcrumbJsonLd(input.locale, [
      { name: input.tenant.tenantName, path: "/" },
      { name: input.name, path: input.path },
    ]),
  ];
}

export function getFaqPageJsonLd(input: {
  locale: string;
  tenant: TenantConfig;
  pageName: string;
  description?: string;
  faqs: FaqSchemaItem[];
}) {
  return [
    ...getSimplePageJsonLd({
      locale: input.locale,
      tenant: input.tenant,
      path: "/faq",
      name: input.pageName,
      description: input.description,
    }),
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: input.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ];
}

export function getLocalizedAlternatesJsonLd(path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: getAbsoluteUrl(path),
    isPartOf: {
      "@id": `${getBaseUrl()}/#website`,
    },
    hasPart: Object.entries(getAbsoluteLocaleAlternates(path)).map(([locale, url]) => ({
      "@type": "WebPage",
      inLanguage: locale,
      url,
    })),
  };
}

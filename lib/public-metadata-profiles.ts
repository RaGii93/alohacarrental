import type { PublicProfile } from "@/lib/deployment-profiles";

export type PublicMetadataPage = "root" | "home" | "fleet" | "book" | "faq";
export type PublicMetadataCopy = {
  title: string;
  description?: string;
};

const rentalKeywords = [
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

const saasKeywords = [
  "car rental software",
  "car rental SaaS",
  "car rental management software",
  "car rental booking software",
  "car rental booking engine",
  "vehicle rental software",
  "fleet management software",
  "rental management system",
  "car hire software",
  "island car rental software",
  "Caribbean car rental software",
  "Caribbean car rental platform",
  "multi location car rental software",
  "rental booking platform",
  "online booking system",
  "airport pickup scheduling",
  "pickup and return tracking",
  "QuickBooks car rental integration",
  "Zoho Invoice car rental integration",
  "Bonaire car rental software",
  "Curacao car rental software",
  "Aruba car rental software",
] as const;

export function getPublicKeywords(profile: PublicProfile = "rental") {
  return profile === "saas" ? saasKeywords : rentalKeywords;
}

export function getProfileDefaultDescription(
  profile: PublicProfile,
  locale: string,
  tenantName: string,
): string {
  if (profile === "saas") {
    if (locale === "nl") return `${tenantName} is SaaS-software voor autoverhuur in het Caribisch gebied met online boekingen, vlootbeheer en pickup- en returntracking.`;
    if (locale === "es") return `${tenantName} es software SaaS para alquiler de autos en el Caribe con reservas en línea, gestión de flota y seguimiento de recogidas y devoluciones.`;
    return `${tenantName} is Caribbean car rental software with online booking, fleet management, and pickup and return tracking for island operators.`;
  }

  if (locale === "nl") return `Reserveer huurauto's snel en veilig met ${tenantName}.`;
  if (locale === "es") return `Reserva vehículos de alquiler de forma rápida y segura con ${tenantName}.`;
  return `Book rental vehicles quickly and securely with ${tenantName}.`;
}

export function getPublicMetadataCopy(
  profile: PublicProfile,
  page: PublicMetadataPage,
  locale: string,
  tenantName: string,
): PublicMetadataCopy {
  if (profile === "saas") {
    const byPage = {
      root: {
        en: { title: `${tenantName} | Caribbean Car Rental Software` },
        nl: { title: `${tenantName} | Caribische Autoverhuursoftware` },
        es: { title: `${tenantName} | Software de Alquiler de Autos para el Caribe` },
      },
      home: {
        en: {
          title: `${tenantName} | Car Rental Software for Caribbean Operators`,
          description: `${tenantName} is a car rental SaaS platform built for Caribbean operators with online booking, fleet control, pickup and return tracking, and accounting integrations.`,
        },
        nl: {
          title: `${tenantName} | Autoverhuursoftware voor Caribische Operators`,
          description: `${tenantName} is een SaaS-platform voor autoverhuur, gebouwd voor Caribische operators met online boekingen, vlootbeheer, pickup- en returntracking en boekhoudintegraties.`,
        },
        es: {
          title: `${tenantName} | Software de Alquiler para Operadores del Caribe`,
          description: `${tenantName} es una plataforma SaaS para alquiler de autos creada para operadores del Caribe con reservas en línea, control de flota, seguimiento de recogidas y devoluciones e integraciones contables.`,
        },
      },
      fleet: {
        en: {
          title: `Fleet Management for Car Rental Teams | ${tenantName}`,
          description: `See how ${tenantName} presents vehicle categories, live rates, and fleet details inside a Caribbean-ready car rental platform.`,
        },
        nl: {
          title: `Vlootbeheer voor Autoverhuurteams | ${tenantName}`,
          description: `Bekijk hoe ${tenantName} voertuigcategorieën, actuele tarieven en vlootdetails presenteert binnen een Caribisch autoverhuurplatform.`,
        },
        es: {
          title: `Gestión de Flota para Equipos de Alquiler | ${tenantName}`,
          description: `Mira cómo ${tenantName} muestra categorías de vehículos, tarifas en vivo y detalles de flota dentro de una plataforma de alquiler preparada para el Caribe.`,
        },
      },
      book: {
        en: {
          title: `Online Booking Engine Demo | ${tenantName}`,
          description: `Preview the ${tenantName} booking engine with live availability, pickup and dropoff flows, extras, and pricing for Caribbean car rental businesses.`,
        },
        nl: {
          title: `Demo van de Online Boekingsengine | ${tenantName}`,
          description: `Bekijk de boekingsengine van ${tenantName} met live beschikbaarheid, pickup- en dropoffflows, extra's en prijzen voor Caribische autoverhuurbedrijven.`,
        },
        es: {
          title: `Demo del Motor de Reservas en Línea | ${tenantName}`,
          description: `Explora el motor de reservas de ${tenantName} con disponibilidad en vivo, flujos de recogida y entrega, extras y precios para empresas de alquiler del Caribe.`,
        },
      },
      faq: {
        en: {
          title: `Car Rental Software FAQ | ${tenantName}`,
          description: `Answers about ${tenantName}, the Caribbean-focused car rental SaaS platform for online bookings, fleet operations, billing, and daily rental workflows.`,
        },
        nl: {
          title: `FAQ over Autoverhuursoftware | ${tenantName}`,
          description: `Antwoorden over ${tenantName}, het Caribisch gerichte SaaS-platform voor autoverhuur met online boekingen, vlootoperaties, facturatie en dagelijkse workflows.`,
        },
        es: {
          title: `Preguntas Frecuentes del Software de Alquiler | ${tenantName}`,
          description: `Respuestas sobre ${tenantName}, la plataforma SaaS de alquiler enfocada en el Caribe para reservas en línea, operaciones de flota, facturación y flujos diarios.`,
        },
      },
    } as const;

    return byPage[page][locale as "en" | "nl" | "es"] || byPage[page].en;
  }

  const byPage = {
    root: {
      en: { title: tenantName },
      nl: { title: tenantName },
      es: { title: tenantName },
    },
    home: {
      en: {
        title: `${tenantName} | Premium Car Rental`,
        description: `Rent vehicles with transparent pricing, fast booking, and trusted support from ${tenantName}.`,
      },
      nl: {
        title: `${tenantName} | Premium Autoverhuur`,
        description: `Huur voertuigen met transparante prijzen, snelle boeking en betrouwbare ondersteuning van ${tenantName}.`,
      },
      es: {
        title: `${tenantName} | Alquiler Premium de Coches`,
        description: `Alquila vehículos con precios transparentes, reserva rápida y soporte confiable de ${tenantName}.`,
      },
    },
    fleet: {
      en: { title: `Fleet Overview | ${tenantName}` },
      nl: { title: `Vlootoverzicht | ${tenantName}` },
      es: { title: `Resumen de Flota | ${tenantName}` },
    },
    book: {
      en: { title: `Book a Vehicle | ${tenantName}` },
      nl: { title: `Voertuig Reserveren | ${tenantName}` },
      es: { title: `Reservar Vehículo | ${tenantName}` },
    },
    faq: {
      en: { title: `FAQ | ${tenantName}` },
      nl: { title: `FAQ | ${tenantName}` },
      es: { title: `FAQ | ${tenantName}` },
    },
  } as const;

  return byPage[page][locale as "en" | "nl" | "es"] || byPage[page].en;
}

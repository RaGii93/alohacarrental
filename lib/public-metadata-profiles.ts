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
  "Aloha Car Rental Bonaire",
  "Bonaire car rental",
  "Bonaire airport car rental",
  "Kralendijk car rental",
  "Flamingo Airport car rental",
  "Caribbean car rental",
] as const;

const saasKeywords = [
  "car rental software",
  "car rental SaaS",
  "car rental platform",
  "car rental management software",
  "car rental booking software",
  "car rental booking engine",
  "vehicle rental software",
  "fleet management software",
  "rental management system",
  "car hire software",
  "B2B car rental software",
  "professional car rental platform",
  "car rental operator software",
  "car rental business management",
  "island car rental software",
  "Caribbean car rental software",
  "Caribbean car rental platform",
  "multi location car rental software",
  "rental booking platform",
  "online booking system",
  "airport pickup scheduling",
  "pickup and return tracking",
  "digital rental agreements",
  "car rental billing software",
  "QuickBooks car rental integration",
  "Zoho Invoice car rental integration",
  "accounting integration car rental",
  "holiday car rental operations",
  "rental fleet operations software",
  "Bonaire car rental software",
  "Curacao car rental software",
  "Aruba car rental software",
  "travel car rental software",
  "small business car rental",
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
    if (locale === "nl") return `${tenantName} is professionele SaaS-software voor autoverhuuroperators in het Caribisch gebied. Beheer boekingen, vloot, digitale overeenkomsten en boekhoudintegratie in één platform.`;
    if (locale === "es") return `${tenantName} es software SaaS profesional para operadores de alquiler en el Caribe. Gestiona reservas, flota, acuerdos digitales e integración contable en una plataforma.`;
    return `${tenantName} is professional SaaS software for car rental operators in the Caribbean. Manage bookings, fleet, digital agreements, and accounting integration in one platform.`;
  }

  if (locale === "nl") return `Reserveer premium huurauto's in Bonaire met ${tenantName}, inclusief luchthavenpickup, transparante prijzen en snelle bevestiging.`;
  if (locale === "es") return `Reserva autos de alquiler premium en Bonaire con ${tenantName}, con recogida en el aeropuerto, precios transparentes y confirmación rápida.`;
  return `Book premium car rental in Bonaire with ${tenantName}, including airport pickup, transparent pricing, and fast confirmation.`;
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
        en: { title: `${tenantName} | Professional Car Rental Platform for Caribbean Operators` },
        nl: { title: `${tenantName} | Professioneel Autoverhuurplatform voor Caribische Operators` },
        es: { title: `${tenantName} | Plataforma Profesional de Alquiler para Operadores del Caribe` },
      },
      home: {
        en: {
          title: `${tenantName} | Car Rental SaaS Platform Built for Caribbean Operators`,
          description: `Manage your car rental business like a pro. Online bookings, fleet control, digital agreements, accounting sync. Used by leading Caribbean operators.`,
        },
        nl: {
          title: `${tenantName} | Autoverhuursoftware Platform voor Caribische Operators`,
          description: `Beheer je autoverhuurbedrijf als een professional. Online boekingen, vlootbeheer, digitale overeenkomsten, boekhoudintegratie. Gebruikt door toonaangevende Caribische operators.`,
        },
        es: {
          title: `${tenantName} | Plataforma SaaS de Alquiler para Operadores del Caribe`,
          description: `Gestiona tu negocio de alquiler como un profesional. Reservas en línea, control de flota, acuerdos digitales, sincronización contable. Utilizado por operadores líderes del Caribe.`,
        },
      },
      fleet: {
        en: {
          title: `Fleet Management System | ${tenantName}`,
          description: `See how ${tenantName} streamlines fleet management with live rates, vehicle details, category management, and operational controls for Caribbean car rental teams.`,
        },
        nl: {
          title: `Vlootbeheersysteem | ${tenantName}`,
          description: `Bekijk hoe ${tenantName} vlootbeheer stroomlijnt met actuele tarieven, voertuigdetails en operationele controles voor Caribische autoverhuurteams.`,
        },
        es: {
          title: `Sistema de Gestión de Flota | ${tenantName}`,
          description: `Observa cómo ${tenantName} optimiza la gestión de flota con tarifas en tiempo real, detalles de vehículos y controles operacionales para equipos de alquiler del Caribe.`,
        },
      },
      book: {
        en: {
          title: `Online Booking System Demo | ${tenantName}`,
          description: `Experience ${tenantName}'s powerful booking engine with real-time availability, pickup/dropoff flows, pricing, and digital agreements for Caribbean rental operators.`,
        },
        nl: {
          title: `Demo Onlineboekingssysteem | ${tenantName}`,
          description: `Ervaar de krachtige boekingsengine van ${tenantName} met realtime beschikbaarheid, pickup-/dropoffflows, prijzen en digitale overeenkomsten.`,
        },
        es: {
          title: `Demo del Sistema de Reservas en Línea | ${tenantName}`,
          description: `Experimenta el potente motor de reservas de ${tenantName} con disponibilidad en tiempo real, flujos de recogida/devolución, precios y acuerdos digitales.`,
        },
      },
      faq: {
        en: {
          title: `Car Rental System FAQ`,
          description: `System-focused answers for online bookings, fleet operations, billing, and daily rental workflows.`,
        },
        nl: {
          title: `FAQ over het Autoverhuursysteem`,
          description: `Systeemgerichte antwoorden over online boekingen, vlootoperaties, facturatie en dagelijkse verhuurworkflows.`,
        },
        es: {
          title: `Preguntas Frecuentes del Sistema de Alquiler`,
          description: `Respuestas enfocadas en el sistema para reservas en línea, operaciones de flota, facturación y flujos diarios de alquiler.`,
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
        title: `${tenantName} | Bonaire Car Rental`,
        description: `Explore Bonaire with premium vehicles, airport-ready pickup, transparent pricing, and trusted local support from ${tenantName}.`,
      },
      nl: {
        title: `${tenantName} | Autoverhuur op Bonaire`,
        description: `Verken Bonaire met premium voertuigen, luchthavenpickup, transparante prijzen en betrouwbare lokale ondersteuning van ${tenantName}.`,
      },
      es: {
        title: `${tenantName} | Alquiler de Autos en Bonaire`,
        description: `Explora Bonaire con vehículos premium, recogida cerca del aeropuerto, precios transparentes y soporte local confiable de ${tenantName}.`,
      },
    },
    fleet: {
      en: {
        title: `Fleet Overview | ${tenantName}`,
        description: `Browse the ${tenantName} fleet in Bonaire, from efficient city cars to spacious SUVs ready for island travel.`,
      },
      nl: {
        title: `Vlootoverzicht | ${tenantName}`,
        description: `Bekijk de ${tenantName}-vloot op Bonaire, van zuinige stadsauto's tot ruime SUV's voor eilandritten.`,
      },
      es: {
        title: `Resumen de Flota | ${tenantName}`,
        description: `Explora la flota de ${tenantName} en Bonaire, desde autos eficientes hasta SUVs espaciosos para recorrer la isla.`,
      },
    },
    book: {
      en: {
        title: `Book a Vehicle | ${tenantName}`,
        description: `Reserve your ${tenantName} rental in Bonaire with a clean booking flow, live availability, and clear pickup details.`,
      },
      nl: {
        title: `Voertuig Reserveren | ${tenantName}`,
        description: `Reserveer je ${tenantName} huurauto op Bonaire met live beschikbaarheid, duidelijke pickup-details en een soepele boekingsflow.`,
      },
      es: {
        title: `Reservar Vehículo | ${tenantName}`,
        description: `Reserva tu auto de ${tenantName} en Bonaire con disponibilidad en vivo, detalles claros de recogida y una experiencia fluida.`,
      },
    },
    faq: {
      en: {
        title: `FAQ | ${tenantName}`,
        description: `Find clear answers about bookings, pickup, insurance, payment, and rental support at ${tenantName}.`,
      },
      nl: {
        title: `FAQ | ${tenantName}`,
        description: `Vind duidelijke antwoorden over reserveringen, pickup, verzekering, betaling en verhuurondersteuning bij ${tenantName}.`,
      },
      es: {
        title: `FAQ | ${tenantName}`,
        description: `Encuentra respuestas claras sobre reservas, recogida, seguro, pago y soporte de alquiler en ${tenantName}.`,
      },
    },
  } as const;

  return byPage[page][locale as "en" | "nl" | "es"] || byPage[page].en;
}

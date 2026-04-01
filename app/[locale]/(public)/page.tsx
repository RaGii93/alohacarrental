import type { Metadata } from "next";
import { HomePageClient } from "@/components/home/HomePageClient";
import { buildMetadata } from "@/lib/seo";
import { getHomeJsonLd } from "@/lib/structured-data";
import { getTenantConfig } from "@/lib/tenant";
import { db } from "@/lib/db";
import { getCategoryFeatureNames } from "@/lib/vehicle-features";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tenant = await getTenantConfig();
  const titleMap: Record<string, string> = {
    en: `${tenant.tenantName} | Premium Car Rental`,
    nl: `${tenant.tenantName} | Premium Autoverhuur`,
    es: `${tenant.tenantName} | Alquiler Premium de Coches`,
  };
  const descriptionMap: Record<string, string> = {
    en: `Rent vehicles with transparent pricing, fast booking, and trusted support from ${tenant.tenantName}.`,
    nl: `Huur voertuigen met transparante prijzen, snelle boeking en betrouwbare ondersteuning van ${tenant.tenantName}.`,
    es: `Alquila vehículos con precios transparentes, reserva rápida y soporte confiable de ${tenant.tenantName}.`,
  };
  return buildMetadata({
    locale,
    path: "/",
    title: titleMap[locale] || titleMap.en,
    description: descriptionMap[locale] || descriptionMap.en,
    tenant,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tenant = await getTenantConfig();
  const jsonLd = getHomeJsonLd(locale, tenant);
  let locations: { id: string; name: string; address: string | null }[] = [];
  let categories: {
    id: string;
    name: string;
    seats: number;
    imageUrl: string | null;
    features: string[];
  }[] = [];
  try {
    locations = await db.location.findMany({
      select: { id: true, name: true, address: true },
      orderBy: { name: "asc" },
    });
  } catch {
    locations = [];
  }

  try {
    categories = await db.vehicleCategory.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        seats: true,
        imageUrl: true,
        hasAC: true,
        hasCarPlay: true,
        features: { include: { feature: true }, orderBy: { feature: { sortOrder: "asc" } } },
      },
      orderBy: { sortOrder: "asc" },
    }).then((rows) => rows.map((category) => ({
      id: category.id,
      name: category.name,
      seats: category.seats,
      imageUrl: category.imageUrl,
      features: getCategoryFeatureNames(category),
    })));
  } catch {
    categories = [];
  }

  return (
    <>
      {jsonLd.map((item, index) => (
        <script
          key={`home-ld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
      <HomePageClient locations={locations} categories={categories} />
    </>
  );
}

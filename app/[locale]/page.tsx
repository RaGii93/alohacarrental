import type { Metadata } from "next";
import { HomePageClient } from "@/components/home/HomePageClient";
import { buildMetadata } from "@/lib/seo";
import { getHomeJsonLd } from "@/lib/structured-data";
import { getTenantConfig } from "@/lib/tenant";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tenant = getTenantConfig();
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
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const jsonLd = getHomeJsonLd(locale);

  return (
    <>
      {jsonLd.map((item, index) => (
        <script
          key={`home-ld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
      <HomePageClient />
    </>
  );
}

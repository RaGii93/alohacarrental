import { BookingWizard } from "@/components/booking/BookingWizard";
import { db } from "@/lib/db";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { getBookingJsonLd } from "@/lib/structured-data";
import { getTenantConfig } from "@/lib/tenant";
import { getMinBookingDays, getTaxPercentage, getVehicleRatesIncludeTax } from "@/lib/settings";
import { SearchCode } from "lucide-react";
import { getCategoryFeatureNames } from "@/lib/vehicle-features";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tenant = await getTenantConfig();
  const titleMap: Record<string, string> = {
    en: `Book a Vehicle | ${tenant.tenantName}`,
    nl: `Voertuig Reserveren | ${tenant.tenantName}`,
    es: `Reservar Vehículo | ${tenant.tenantName}`,
  };
  return buildMetadata({
    locale,
    path: "/book",
    title: titleMap[locale] || titleMap.en,
    tenant,
  });
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const [tenant, taxPercentage, minimumBookingDays, vehicleRatesIncludeTax] = await Promise.all([
    getTenantConfig(),
    getTaxPercentage(),
    getMinBookingDays(),
    getVehicleRatesIncludeTax(),
  ]);
  const jsonLd = getBookingJsonLd(locale, tenant);

  // Fetch predefined pickup/dropoff locations
  const locations = await db.location.findMany({
    select: { id: true, name: true, code: true, address: true },
    orderBy: { name: "asc" },
  });

  let extras: Array<{ id: string; name: string; pricingType: "DAILY" | "FLAT"; amount: number; description?: string | null }> = [];
  if ((db as any).extra && typeof (db as any).extra.findMany === "function") {
    try {
      extras = await (db as any).extra.findMany({
        where: { isActive: true },
        select: { id: true, name: true, pricingType: true, amount: true, description: true },
        orderBy: { name: "asc" },
      });
    } catch {
      extras = [];
    }
  } else {
    try {
      extras = await db.$queryRaw<Array<any>>`
        SELECT id, name, "pricingType", amount, description
        FROM "Extra"
        WHERE "isActive" = true
        ORDER BY name ASC
      `;
    } catch {
      extras = [];
    }
  }
  const categories = await db.vehicleCategory.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      dailyRate: true,
      seats: true,
      transmission: true,
      hasAC: true,
      hasCarPlay: true,
      hasBackupCamera: true,
      features: { include: { feature: true }, orderBy: { feature: { sortOrder: "asc" } } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <>
      {jsonLd.map((item, index) => (
        <script
          key={`book-ld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
      <section className="bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(236,244,255,0.98))]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="mb-8 flex justify-end">
            <Link href={`/${locale}/book/review`}>
              <Button variant="outline" className="h-11 rounded-md border-[#c7daf9] bg-white text-[#0f57b2] shadow-[0_16px_36px_-28px_rgba(12,74,160,0.45)] hover:bg-[#edf4ff] hover:text-[#0b4a97]">
              <SearchCode className="h-4 w-4" />
              {t("booking.reviewLookup.cta")}
              </Button>
            </Link>
          </div>
          <BookingWizard
            locale={locale}
            locations={locations}
            extras={extras}
            categories={categories.map((category) => ({ ...category, features: getCategoryFeatureNames(category) })) as any}
            taxPercentage={taxPercentage}
            vehicleRatesIncludeTax={vehicleRatesIncludeTax}
            minimumBookingDays={minimumBookingDays}
            termsPdfUrl={tenant.termsPdfUrl}
          />
        </div>
      </section>
    </>
  );
}

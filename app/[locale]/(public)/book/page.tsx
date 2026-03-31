import { BookingWizard } from "@/components/booking/BookingWizard";
import { db } from "@/lib/db";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { getBookingJsonLd } from "@/lib/structured-data";
import { getTenantConfig } from "@/lib/tenant";
import { getBookingRuleSettings, getMinBookingDays, getTaxPercentage, getVehicleRatesIncludeTax } from "@/lib/settings";
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
  const [tenant, taxPercentage, minimumBookingDays, vehicleRatesIncludeTax, bookingRuleSettings] = await Promise.all([
    getTenantConfig(),
    getTaxPercentage(),
    getMinBookingDays(),
    getVehicleRatesIncludeTax(),
    getBookingRuleSettings(),
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
      <section className="public-shell-bg relative overflow-hidden pt-24 sm:pt-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(15,39,64,0.1),transparent_32%),radial-gradient(circle_at_85%_18%,rgba(23,184,197,0.12),transparent_26%),radial-gradient(circle_at_12%_82%,rgba(194,178,128,0.08),transparent_26%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-14">
          <div className="mb-8 flex justify-end">
            <Link href={`/${locale}/book/review`}>
              <Button variant="outline" className="public-outline-button h-11 rounded-full text-[rgb(15,39,64)]">
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
            bookingRuleSettings={bookingRuleSettings}
            termsPdfUrl={tenant.termsPdfUrl}
          />
        </div>
      </section>
    </>
  );
}

import { BookingWizard } from "@/components/booking/BookingWizard";
import { db } from "@/lib/db";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { getBookingJsonLd } from "@/lib/structured-data";
import { getTenantConfig } from "@/lib/tenant";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tenant = getTenantConfig();
  const titleMap: Record<string, string> = {
    en: `Book a Vehicle | ${tenant.tenantName}`,
    nl: `Voertuig Reserveren | ${tenant.tenantName}`,
    es: `Reservar Vehículo | ${tenant.tenantName}`,
  };
  return buildMetadata({
    locale,
    path: "/book",
    title: titleMap[locale] || titleMap.en,
  });
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const jsonLd = getBookingJsonLd(locale);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-4 flex justify-end">
          <Link href={`/${locale}/book/review`}>
            <Button variant="outline">{t("booking.reviewLookup.cta")}</Button>
          </Link>
        </div>
        <BookingWizard locale={locale} locations={locations} extras={extras} categories={categories as any} />
      </div>
    </>
  );
}

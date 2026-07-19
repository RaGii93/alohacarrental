import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SearchCode, ShieldCheck, Sparkles } from "lucide-react";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { DEFAULT_PUBLIC_PROFILE } from "@/lib/deployment-profiles";
import { getPublicMetadataCopy } from "@/lib/public-metadata-profiles";
import { getPublicLocations, getPublicVehicleCategories } from "@/lib/public-data";
import { getBookingJsonLd } from "@/lib/structured-data";
import { getTenantConfig } from "@/lib/tenant";
import { getLocalizedTermsPdfUrl } from "@/lib/terms-locale";
import { getBookingRuleSettings, getTaxPercentage, getVehicleRatesIncludeTax } from "@/lib/settings";
import { parseLaPazDateInput } from "@/lib/timezone";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const bookCopy = {
  en: {
    eyebrow: "ALOHA BOOKING",
    title: "Reserve Your Local Island Ride",
    description: "Book your vehicle in just a few simple steps and get ready to explore Bonaire with confidence.",
    asideTitle: "Before You Book",
    asidePoints: [
      "Online bookings require a minimum 3-day rental.",
      "Last-minute or daily rentals? Contact us via WhatsApp or email.",
    ],
  },
  es: {
    eyebrow: "ALOHA BOOKING",
    title: "Reserve Your Local Island Ride",
    description: "Book your vehicle in just a few simple steps and get ready to explore Bonaire with confidence.",
    asideTitle: "Before You Book",
    asidePoints: [
      "Online bookings require a minimum 3-day rental.",
      "Last-minute or daily rentals? Contact us via WhatsApp or email.",
    ],
  },
  nl: {
    eyebrow: "ALOHA BOOKING",
    title: "Reserve Your Local Island Ride",
    description: "Book your vehicle in just a few simple steps and get ready to explore Bonaire with confidence.",
    asideTitle: "Before You Book",
    asidePoints: [
      "Online bookings require a minimum 3-day rental.",
      "Last-minute or daily rentals? Contact us via WhatsApp or email.",
    ],
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tenant = await getTenantConfig();
  const metadataCopy = getPublicMetadataCopy(DEFAULT_PUBLIC_PROFILE, "book", locale, tenant.tenantName);
  return buildMetadata({
    locale,
    path: "/book",
    title: metadataCopy.title,
    description: metadataCopy.description,
    tenant,
  });
}

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ startDate?: string; endDate?: string; pickupTime?: string; dropoffTime?: string; categoryId?: string; pickupLocationId?: string; dropoffLocationId?: string }>;
}) {
  const { locale } = await params;
  const { startDate, endDate, pickupTime, dropoffTime, categoryId, pickupLocationId, dropoffLocationId } = await searchParams;
  const t = await getTranslations();
  const copy = bookCopy[locale as keyof typeof bookCopy] || bookCopy.en;
  const [tenant, taxPercentage, bookingRules, vehicleRatesIncludeTax] = await Promise.all([
    getTenantConfig(),
    getTaxPercentage(),
    getBookingRuleSettings(),
    getVehicleRatesIncludeTax(),
  ]);
  const localizedTermsPdfUrl = getLocalizedTermsPdfUrl(locale, tenant.termsPdfUrl);
  const jsonLd = getBookingJsonLd(locale, tenant);
  const locations = await getPublicLocations();

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
  const categories = await getPublicVehicleCategories();

  return (
    <>
      {jsonLd.map((item, index) => (
        <script
          key={`book-ld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
      <section className="bg-white">
        <div className="border-b border-[#f2ebe6] bg-[#faf8f6]">
          <div className="mx-auto max-w-7xl px-4 pt-28 pb-14 sm:px-6 lg:px-8 lg:pb-18">
            <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#FF912C] sm:text-[15px]">
                  {copy.eyebrow}
                </p>
                <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-[#111111] sm:text-5xl">
                  {copy.title}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-[#57534e]">
                  {copy.description}
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-[#efe7df] bg-white p-5 shadow-[0_20px_60px_-44px_rgba(0,0,0,0.18)]">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF4E6] text-[#FF912C]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111111]">{copy.asideTitle}</p>
                    <p className="text-sm text-[#78716c]">{tenant.tenantName}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {copy.asidePoints.map((point) => (
                    <div key={point} className="flex items-start gap-3 text-sm text-[#57534e]">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-[#FF912C]" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Link href={`/${locale}/book/review`}>
                <Button variant="outline" className="h-11 rounded-full border-[#e7dcd5] bg-white px-5 text-sm font-semibold">
                <SearchCode className="h-4 w-4 text-[#FF912C]" />
                Manage Booking
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <BookingWizard
            locale={locale}
            locations={locations}
            extras={extras}
            categories={categories as any}
            taxPercentage={taxPercentage}
            vehicleRatesIncludeTax={vehicleRatesIncludeTax}
            bookingRuleSettings={bookingRules}
            termsPdfUrl={localizedTermsPdfUrl}
            showHeader={false}
            initialData={{
              startDate: startDate ? parseLaPazDateInput(startDate) : null,
              endDate: endDate ? parseLaPazDateInput(endDate) : null,
              pickupTime: pickupTime || undefined,
              dropoffTime: dropoffTime || undefined,
              categoryId: categoryId || null,
              pickupLocationId: pickupLocationId || "",
              dropoffLocationId: dropoffLocationId || "",
            }}
          />
        </div>
      </section>
    </>
  );
}

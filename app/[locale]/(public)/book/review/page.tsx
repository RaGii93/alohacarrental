import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, MapPin, Search, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { DocumentPreview } from "@/components/shared/DocumentPreview";
import { buildMetadata } from "@/lib/seo";
import { getTenantConfig } from "@/lib/tenant";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { buildGoogleMapsUrl } from "@/lib/location-map";
import { ensureBookingAdditionalDriversTable } from "@/lib/additional-drivers.server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tenant = await getTenantConfig();
  const titleMap: Record<string, string> = {
    en: `Review Your Booking | ${tenant.tenantName}`,
    nl: `Bekijk Je Reservering | ${tenant.tenantName}`,
    es: `Revisa Tu Reserva | ${tenant.tenantName}`,
  };
  return buildMetadata({
    locale,
    path: "/book/review",
    title: titleMap[locale] || titleMap.en,
    noIndex: true,
    tenant,
  });
}

export default async function BookingReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const { locale } = await params;
  const { code } = await searchParams;
  const t = await getTranslations();
  const lookupValue = (code || "").trim();
  const lookupUpper = lookupValue.toUpperCase();
  await ensureBookingAdditionalDriversTable();

  const booking = lookupValue
    ? await db.booking.findFirst({
        where: {
          OR: [
            { bookingCode: { equals: lookupValue, mode: "insensitive" } },
            { bookingCode: lookupUpper },
            { id: lookupValue },
            { id: { startsWith: lookupValue } },
          ],
        },
        orderBy: { createdAt: "desc" },
        include: { vehicle: true, pickupLocationRef: true, dropoffLocationRef: true, additionalDrivers: true },
      })
    : null;

  const pickupMapUrl = booking
    ? buildGoogleMapsUrl({
        latitude: booking.pickupLatitude,
        longitude: booking.pickupLongitude,
        query: booking.pickupLocationAddress || booking.pickupLocation || booking.pickupLocationRef?.address,
      })
    : null;
  const dropoffMapUrl = booking
    ? buildGoogleMapsUrl({
        latitude: booking.dropoffLatitude,
        longitude: booking.dropoffLongitude,
        query: booking.dropoffLocationAddress || booking.dropoffLocation || booking.dropoffLocationRef?.address,
      })
    : null;

  return (
    <section className="bg-white">
      <div className="border-b border-[#f2ebe6] bg-[#faf8f6]">
        <div className="mx-auto max-w-5xl px-4 pt-28 pb-14 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#FF912C] sm:text-[15px]">
            {t("booking.reviewLookup.title")}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[#111111]">
            {t("booking.reviewLookup.subtitle")}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="rounded-[1.75rem] border-[#efe7df] bg-white p-6 shadow-[0_24px_60px_-44px_rgba(0,0,0,0.16)]">
          <form className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <input
              type="text"
              name="code"
              defaultValue={lookupValue}
              placeholder={t("booking.reviewLookup.placeholder")}
              className="h-12 rounded-2xl border border-[#ece7e2] bg-[#fafaf9] px-4 text-sm text-[#111111]"
            />
            <Button type="submit" className="h-12 rounded-full bg-[#FF912C] px-6 font-semibold text-white hover:bg-[#E67F1F]">
              <Search className="h-4 w-4" />
              {t("booking.reviewLookup.submit")}
            </Button>
          </form>
        </Card>

        {lookupValue && !booking ? (
          <Card className="rounded-[1.75rem] border-orange-200 bg-orange-50 p-6 text-sm text-orange-700">
            {t("booking.reviewLookup.notFound")}
          </Card>
        ) : null}

        {booking ? (
          <Card className="rounded-[1.75rem] border-[#efe7df] bg-white p-6 shadow-[0_24px_60px_-44px_rgba(0,0,0,0.16)]">
            <div className="flex flex-col gap-4 border-b border-[#f2ebe6] pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#FF912C] sm:text-[15px]">
                  {t("booking.bookingCode")}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#111111]">{booking.bookingCode}</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF4E6] px-4 py-2 text-sm font-medium text-[#FF912C]">
                <ShieldCheck className="h-4 w-4" />
                {booking.status}
              </div>
            </div>

            <dl className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                [t("booking.customerName"), booking.customerName],
                [t("booking.customerEmail"), booking.customerEmail],
                [t("booking.customerPhone"), booking.customerPhone],
                [t("booking.flightNumber"), booking.flightNumber || "-"],
                [t("booking.selectVehicle"), booking.vehicle?.name ?? "-"],
                [t("booking.startDate"), formatDateTime(booking.startDate)],
                [t("booking.endDate"), formatDateTime(booking.endDate)],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-[1.25rem] border border-[#efe7df] bg-[#faf8f6] p-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a8a29e]">{label}</dt>
                  <dd className="mt-2 text-sm text-[#111111]">{value}</dd>
                </div>
              ))}
              <div className="rounded-[1.25rem] border border-[#efe7df] bg-[#faf8f6] p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a8a29e]">{t("booking.pickupLocation")}</dt>
                <dd className="mt-2 text-sm text-[#111111]">
                  {booking.pickupLocation || booking.pickupLocationRef?.name || "-"}
                  {booking.pickupLocationAddress ? <span className="block text-xs text-[#78716c]">{booking.pickupLocationAddress}</span> : null}
                  {pickupMapUrl ? (
                    <a href={pickupMapUrl} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 text-[#FF912C] hover:underline">
                      <MapPin className="h-3.5 w-3.5" />
                      {t("booking.map")}
                    </a>
                  ) : null}
                </dd>
              </div>
              <div className="rounded-[1.25rem] border border-[#efe7df] bg-[#faf8f6] p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a8a29e]">{t("booking.dropoffLocation")}</dt>
                <dd className="mt-2 text-sm text-[#111111]">
                  {booking.dropoffLocation || booking.dropoffLocationRef?.name || "-"}
                  {booking.dropoffLocationAddress ? <span className="block text-xs text-[#78716c]">{booking.dropoffLocationAddress}</span> : null}
                  {dropoffMapUrl ? (
                    <a href={dropoffMapUrl} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 text-[#FF912C] hover:underline">
                      <MapPin className="h-3.5 w-3.5" />
                      {t("booking.map")}
                    </a>
                  ) : null}
                </dd>
              </div>
            </dl>

            <div className="mt-6 space-y-4">
              <DocumentPreview
                url={booking.driverLicenseUrl}
                title={t("booking.driverLicense")}
                openLabel={t("booking.openOriginal")}
                emptyLabel={t("booking.documentUnavailable")}
              />
              {booking.additionalDrivers.length > 0 ? (
                <div className="rounded-[1.25rem] border border-[#efe7df] bg-[#faf8f6] p-4">
                  <p className="text-sm font-semibold text-[#111111]">{t("booking.additionalDrivers.summaryTitle")}</p>
                  <div className="mt-3 space-y-4">
                    {booking.additionalDrivers.map((driver) => (
                      <div key={driver.id} className="rounded-[1rem] border border-[#ece7e2] bg-white p-4">
                        <p className="text-sm font-semibold text-[#111111]">{driver.fullName}</p>
                        <p className="mt-1 text-xs text-[#78716c]">
                          {t("booking.additionalDrivers.birthDate")}: {formatDate(driver.birthDate)}
                        </p>
                        <p className="text-xs text-[#78716c]">
                          {t("booking.additionalDrivers.licenseNumber")}: {driver.driverLicenseNumber}
                        </p>
                        <p className="text-xs text-[#78716c]">
                          {t("booking.additionalDrivers.licenseExpiryDate")}: {formatDate(driver.licenseExpiryDate)}
                        </p>
                        <div className="mt-3">
                          <DocumentPreview
                            url={driver.driverLicenseUrl}
                            title={driver.fullName}
                            openLabel={t("booking.openOriginal")}
                            emptyLabel={t("booking.documentUnavailable")}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {booking.invoiceUrl ? (
                <DocumentPreview
                  url={booking.invoiceUrl}
                  title="Billing Document"
                  openLabel={t("booking.openOriginal")}
                  emptyLabel={t("booking.documentUnavailable")}
                />
              ) : null}
            </div>
          </Card>
        ) : null}

        <div>
          <Link href={`/${locale}/book`}>
            <Button variant="outline" className="h-11 rounded-full border-[#e7dcd5] px-5 font-semibold">
              <ArrowLeft className="h-4 w-4" />
              {t("booking.backToBooking")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

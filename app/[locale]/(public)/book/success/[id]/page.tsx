import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CarFront, CheckCircle, Home, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { getTenantConfig } from "@/lib/tenant";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { buildGoogleMapsUrl } from "@/lib/location-map";
import { resolveLocationDisplay } from "@/lib/location-display";
import { ensureBookingAdditionalDriversTable } from "@/lib/additional-drivers.server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tenant = await getTenantConfig();
  const titleMap: Record<string, string> = {
    en: `Booking Submitted | ${tenant.tenantName}`,
    nl: `Reservering Verzonden | ${tenant.tenantName}`,
    es: `Reserva Enviada | ${tenant.tenantName}`,
  };
  return buildMetadata({
    locale,
    path: "/book/success",
    title: titleMap[locale] || titleMap.en,
    noIndex: true,
    tenant,
  });
}

export default async function SuccessPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: bookingCode } = await params;
  const t = await getTranslations();
  await ensureBookingAdditionalDriversTable();

  const booking = await db.booking.findUnique({
    where: { bookingCode },
    include: { vehicle: true, pickupLocationRef: true, dropoffLocationRef: true, additionalDrivers: true },
  });

  if (!booking) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-[#111111]">{t("errors.notFound")}</h1>
      </div>
    );
  }

  const pickupLocationDisplay = resolveLocationDisplay({
    label: booking.pickupLocation,
    fallbackName: booking.pickupLocationRef?.name,
    address: booking.pickupLocationAddress,
    fallbackAddress: booking.pickupLocationRef?.address,
  });
  const dropoffLocationDisplay = resolveLocationDisplay({
    label: booking.dropoffLocation,
    fallbackName: booking.dropoffLocationRef?.name,
    address: booking.dropoffLocationAddress,
    fallbackAddress: booking.dropoffLocationRef?.address,
  });

  const pickupMapUrl = buildGoogleMapsUrl({
    latitude: booking.pickupLatitude,
    longitude: booking.pickupLongitude,
    query: pickupLocationDisplay.mapQuery,
  });
  const dropoffMapUrl = buildGoogleMapsUrl({
    latitude: booking.dropoffLatitude,
    longitude: booking.dropoffLongitude,
    query: dropoffLocationDisplay.mapQuery,
  });

  return (
    <section className="bg-white">
      <div className="border-b border-[#f2ebe6] bg-[#faf8f6]">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#dcfce7] text-[#15803d]">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-[#111111]">
            {t("booking.success.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[#57534e]">
            {t("booking.success.message", { orderId: booking.bookingCode })}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="rounded-[1.75rem] border-[#efe7df] bg-white p-6 shadow-[0_24px_60px_-44px_rgba(0,0,0,0.16)]">
          <div className="rounded-[1.25rem] border border-[#efe7df] bg-[#faf8f6] p-5">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#b91c1c] sm:text-[15px]">
              {t("booking.bookingCode")}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-[0.06em] text-[#111111]">
              {booking.bookingCode}
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              [t("common.name"), booking.customerName],
              [t("common.email"), booking.customerEmail],
              [t("booking.flightNumber"), booking.flightNumber || "-"],
              [t("booking.birthDate"), booking.birthDate ? formatDate(booking.birthDate) : "-"],
              [t("booking.selectVehicle"), booking.vehicle?.name ?? "-"],
              [t("booking.startDate"), formatDateTime(booking.startDate)],
              [t("booking.endDate"), formatDateTime(booking.endDate)],
              [t("booking.licenseExpiryDate"), booking.licenseExpiryDate ? formatDate(booking.licenseExpiryDate) : "-"],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-[1.25rem] border border-[#efe7df] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a8a29e]">{label}</p>
                <p className="mt-2 text-sm text-[#111111]">{value}</p>
              </div>
            ))}
            <div className="rounded-[1.25rem] border border-[#efe7df] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a8a29e]">{t("booking.pickupLocation")}</p>
              <p className="mt-2 text-sm text-[#111111]">
                {pickupLocationDisplay.primary}
                {pickupLocationDisplay.secondary ? <span className="block text-xs text-[#78716c]">{pickupLocationDisplay.secondary}</span> : null}
                {pickupMapUrl ? (
                  <a href={pickupMapUrl} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 text-[#b91c1c] hover:underline">
                    <MapPin className="h-3.5 w-3.5" />
                    {t("booking.map")}
                  </a>
                ) : null}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-[#efe7df] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a8a29e]">{t("booking.dropoffLocation")}</p>
              <p className="mt-2 text-sm text-[#111111]">
                {dropoffLocationDisplay.primary}
                {dropoffLocationDisplay.secondary ? <span className="block text-xs text-[#78716c]">{dropoffLocationDisplay.secondary}</span> : null}
                {dropoffMapUrl ? (
                  <a href={dropoffMapUrl} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 text-[#b91c1c] hover:underline">
                    <MapPin className="h-3.5 w-3.5" />
                    {t("booking.map")}
                  </a>
                ) : null}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.25rem] border border-[#efe7df] bg-[#faf8f6] p-5">
            <p className="text-sm text-[#57534e]">{t("booking.success.next")}</p>
            <p className="mt-3 text-xl font-semibold text-[#111111]">${(booking.totalAmount / 100).toFixed(2)}</p>
          </div>

          {booking.additionalDrivers.length > 0 ? (
            <div className="mt-6 rounded-[1.25rem] border border-[#efe7df] bg-white p-5">
              <p className="text-sm font-semibold text-[#111111]">{t("booking.additionalDrivers.summaryTitle")}</p>
              <div className="mt-3 space-y-3">
                {booking.additionalDrivers.map((driver) => (
                  <div key={driver.id} className="rounded-xl border border-[#efe7df] bg-[#faf8f6] p-4 text-sm text-[#111111]">
                    <p className="font-semibold">{driver.fullName}</p>
                    <p className="mt-1 text-[#57534e]">{t("booking.additionalDrivers.birthDate")}: {formatDate(driver.birthDate)}</p>
                    <p className="text-[#57534e]">{t("booking.additionalDrivers.licenseNumber")}: {driver.driverLicenseNumber}</p>
                    <p className="text-[#57534e]">{t("booking.additionalDrivers.licenseExpiryDate")}: {formatDate(driver.licenseExpiryDate)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-4 sm:flex-row">
            <Link href={`/${locale}`}>
              <Button variant="outline" className="h-11 rounded-full border-[#e7dcd5] px-5 font-semibold">
                <Home className="h-4 w-4" />
                {t("nav.home")}
              </Button>
            </Link>
            <Link href={`/${locale}/book`}>
              <Button className="h-11 rounded-full bg-[#b91c1c] px-5 font-semibold text-white hover:bg-[#991b1b]">
                <CarFront className="h-4 w-4" />
                {t("nav.booking")}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
}

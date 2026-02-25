import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { db } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { getTenantConfig } from "@/lib/tenant";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { CarFront, Home, MapPin } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tenant = getTenantConfig();
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
  });
}

export default async function SuccessPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: bookingCode } = await params;
  const t = await getTranslations();

  const booking = await db.booking.findUnique({
    where: { bookingCode },
    include: { vehicle: true, pickupLocationRef: true, dropoffLocationRef: true },
  });

  if (!booking) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold">{t("errors.notFound")}</h1>
      </div>
    );
  }

  const pickupMapUrl = booking.pickupLocationRef?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.pickupLocationRef.address)}`
    : null;
  const dropoffMapUrl = booking.dropoffLocationRef?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.dropoffLocationRef.address)}`
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card className="p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold mb-2">
          {t("booking.success.title")}
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          {t("booking.success.message", { orderId: booking.bookingCode })}
        </p>
        <div className="mb-6 rounded-lg border bg-gray-50 p-4">
          <p className="text-sm text-gray-600">{t("booking.bookingCode")}</p>
          <p className="text-xl font-semibold tracking-wide">{booking.bookingCode}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
          <h2 className="font-semibold mb-4">{t("admin.bookings.detail.bookingInfo")}</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">{t("common.name")}:</dt>
              <dd className="font-medium">{booking.customerName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">{t("common.email")}:</dt>
              <dd className="font-medium">{booking.customerEmail}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">{t("booking.birthDate")}:</dt>
              <dd className="font-medium">{booking.birthDate ? formatDate(booking.birthDate) : "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">{t("booking.selectVehicle")}:</dt>
              <dd className="font-medium">{booking.vehicle?.name ?? "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">{t("booking.startDate")}:</dt>
              <dd className="font-medium">
                {formatDateTime(booking.startDate)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">{t("booking.endDate")}:</dt>
              <dd className="font-medium">
                {formatDateTime(booking.endDate)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">{t("booking.pickupLocation")}:</dt>
              <dd className="font-medium">
                {booking.pickupLocationRef?.name || booking.pickupLocation || "-"}
                {pickupMapUrl && (
                  <>
                    {" "}
                    <a href={pickupMapUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      <span className="inline-flex items-center gap-1">(<MapPin className="h-3.5 w-3.5" /> {t("booking.map")})</span>
                    </a>
                  </>
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">{t("booking.dropoffLocation")}:</dt>
              <dd className="font-medium">
                {booking.dropoffLocationRef?.name || booking.dropoffLocation || "-"}
                {dropoffMapUrl && (
                  <>
                    {" "}
                    <a href={dropoffMapUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      <span className="inline-flex items-center gap-1">(<MapPin className="h-3.5 w-3.5" /> {t("booking.map")})</span>
                    </a>
                  </>
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">{t("booking.licenseExpiryDate")}:</dt>
              <dd className="font-medium">{booking.licenseExpiryDate ? formatDate(booking.licenseExpiryDate) : "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">{t("admin.bookings.table.total")}:</dt>
              <dd className="font-medium">
                ${(booking.totalAmount / 100).toFixed(2)}
              </dd>
            </div>
          </dl>
        </div>

        <p className="text-gray-600 mb-6">{t("booking.success.next")}</p>

        <div className="flex gap-4 justify-center">
          <Link href={`/${locale}`}>
            <Button variant="outline">
              <Home className="h-4 w-4" />
              {t("nav.home")}
            </Button>
          </Link>
          <Link href={`/${locale}/book`}>
            <Button>
              <CarFront className="h-4 w-4" />
              {t("nav.booking")}
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

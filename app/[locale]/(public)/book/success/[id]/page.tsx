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
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <Card className="overflow-hidden rounded-[2rem] border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),hsl(var(--primary)/0.08)_52%,hsl(var(--accent)/0.08)_100%)] p-8 text-center shadow-[0_30px_90px_-44px_hsl(var(--foreground)/0.18)] ring-1 ring-white/60 backdrop-blur-xl">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.76),hsl(var(--accent)/0.26))] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-xl">
            <CheckCircle className="h-12 w-12 text-[hsl(var(--primary))]" />
          </div>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-[hsl(var(--foreground))]">
          {t("booking.success.title")}
        </h1>
        <p className="mb-6 text-lg text-[hsl(var(--muted-foreground))]">
          {t("booking.success.message", { orderId: booking.bookingCode })}
        </p>
        <div className="mb-6 rounded-[1.5rem] border border-white/60 bg-white/72 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ring-1 ring-white/55 backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">{t("booking.bookingCode")}</p>
          <p className="text-xl font-semibold tracking-wide">{booking.bookingCode}</p>
        </div>

        <div className="mb-6 rounded-[1.75rem] border border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),hsl(var(--accent)/0.12))] p-6 text-left shadow-[0_20px_50px_-36px_hsl(var(--foreground)/0.14)] ring-1 ring-white/55 backdrop-blur-xl">
          <h2 className="mb-4 font-semibold text-[hsl(var(--foreground))]">{t("admin.bookings.detail.bookingInfo")}</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[hsl(var(--muted-foreground))]">{t("common.name")}:</dt>
              <dd className="font-medium">{booking.customerName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[hsl(var(--muted-foreground))]">{t("common.email")}:</dt>
              <dd className="font-medium">{booking.customerEmail}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[hsl(var(--muted-foreground))]">{t("booking.flightNumber")}:</dt>
              <dd className="font-medium">{booking.flightNumber || "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[hsl(var(--muted-foreground))]">{t("booking.birthDate")}:</dt>
              <dd className="font-medium">{booking.birthDate ? formatDate(booking.birthDate) : "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[hsl(var(--muted-foreground))]">{t("booking.selectVehicle")}:</dt>
              <dd className="font-medium">{booking.vehicle?.name ?? "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[hsl(var(--muted-foreground))]">{t("booking.startDate")}:</dt>
              <dd className="font-medium">
                {formatDateTime(booking.startDate)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[hsl(var(--muted-foreground))]">{t("booking.endDate")}:</dt>
              <dd className="font-medium">
                {formatDateTime(booking.endDate)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[hsl(var(--muted-foreground))]">{t("booking.pickupLocation")}:</dt>
              <dd className="font-medium">
                {booking.pickupLocationRef?.name || booking.pickupLocation || "-"}
                {pickupMapUrl && (
                  <>
                    {" "}
                    <a href={pickupMapUrl} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--primary))] hover:underline">
                      <span className="inline-flex items-center gap-1">(<MapPin className="h-3.5 w-3.5" /> {t("booking.map")})</span>
                    </a>
                  </>
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[hsl(var(--muted-foreground))]">{t("booking.dropoffLocation")}:</dt>
              <dd className="font-medium">
                {booking.dropoffLocationRef?.name || booking.dropoffLocation || "-"}
                {dropoffMapUrl && (
                  <>
                    {" "}
                    <a href={dropoffMapUrl} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--primary))] hover:underline">
                      <span className="inline-flex items-center gap-1">(<MapPin className="h-3.5 w-3.5" /> {t("booking.map")})</span>
                    </a>
                  </>
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[hsl(var(--muted-foreground))]">{t("booking.licenseExpiryDate")}:</dt>
              <dd className="font-medium">{booking.licenseExpiryDate ? formatDate(booking.licenseExpiryDate) : "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[hsl(var(--muted-foreground))]">{t("admin.bookings.table.total")}:</dt>
              <dd className="font-medium">
                ${(booking.totalAmount / 100).toFixed(2)}
              </dd>
            </div>
          </dl>
        </div>

        <p className="mb-6 text-[hsl(var(--muted-foreground))]">{t("booking.success.next")}</p>

        <div className="flex justify-center gap-4">
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

import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { DocumentPreview } from "@/components/shared/DocumentPreview";
import { buildMetadata } from "@/lib/seo";
import { getTenantConfig } from "@/lib/tenant";
import { formatDateTime } from "@/lib/datetime";
import { ArrowLeft, CalendarClock, MapPin, Search, Ticket } from "lucide-react";

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
        include: { vehicle: true, pickupLocationRef: true, dropoffLocationRef: true },
      })
    : null;

  const pickupMapUrl = booking?.pickupLocationRef?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.pickupLocationRef.address)}`
    : null;
  const dropoffMapUrl = booking?.dropoffLocationRef?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.dropoffLocationRef.address)}`
    : null;

  return (
    <section className="public-shell-bg relative overflow-hidden pt-24 sm:pt-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(15,39,64,0.08),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(23,184,197,0.1),transparent_24%)]" />
      <div className="relative mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="public-glass-card-strong overflow-hidden rounded-[2rem] p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="public-accent-icon flex h-12 w-12 items-center justify-center rounded-2xl">
            <Ticket className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">{t("booking.reviewLookup.title")}</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{t("booking.reviewLookup.subtitle")}</p>
          </div>
        </div>
        <form className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            name="code"
            defaultValue={lookupValue}
            placeholder={t("booking.reviewLookup.placeholder")}
            className="h-11 w-full rounded-full border border-white/60 bg-white/90 px-4 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] outline-none ring-1 ring-white/60 backdrop-blur-xl placeholder:text-[hsl(var(--muted-foreground))]"
          />
          <Button type="submit" className="public-primary-button rounded-full">
            <Search className="h-4 w-4" />
            {t("booking.reviewLookup.submit")}
          </Button>
        </form>
      </Card>

      {lookupValue && !booking && (
        <Card className="rounded-[1.75rem] border-red-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(254,242,242,0.96))] p-6 text-sm text-red-700 shadow-[0_24px_60px_-38px_rgba(127,29,29,0.15)] ring-1 ring-white/60 backdrop-blur-xl">
          {t("booking.reviewLookup.notFound")}
        </Card>
      )}

      {booking && (
        <Card className="public-glass-card space-y-5 rounded-[2rem] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">{t("booking.reviewLookup.detailsTitle")}</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{t("booking.bookingCode")}: {booking.bookingCode}</p>
            </div>
            <div className="public-chip rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.16em]">
              {booking.status}
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex justify-between gap-6">
              <dt className="text-muted-foreground">{t("booking.customerName")}</dt>
              <dd className="font-medium">{booking.customerName}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-muted-foreground">{t("booking.customerEmail")}</dt>
              <dd className="font-medium">{booking.customerEmail}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-muted-foreground">{t("booking.customerPhone")}</dt>
              <dd className="font-medium">{booking.customerPhone}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-muted-foreground">{t("booking.flightNumber")}</dt>
              <dd className="font-medium">{booking.flightNumber || "-"}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-muted-foreground">{t("booking.selectVehicle")}</dt>
              <dd className="font-medium">{booking.vehicle?.name ?? "-"}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-muted-foreground">{t("booking.startDate")}</dt>
              <dd className="font-medium">{formatDateTime(booking.startDate)}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-muted-foreground">{t("booking.endDate")}</dt>
              <dd className="font-medium">{formatDateTime(booking.endDate)}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-muted-foreground">{t("booking.pickupLocation")}</dt>
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
            <div className="flex justify-between gap-6">
              <dt className="text-muted-foreground">{t("booking.dropoffLocation")}</dt>
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
          </dl>

          <DocumentPreview
            url={booking.driverLicenseUrl}
            title={t("booking.driverLicense")}
            openLabel={t("booking.openOriginal")}
            emptyLabel={t("booking.documentUnavailable")}
          />
          {booking.invoiceUrl && (
            <DocumentPreview
              url={booking.invoiceUrl}
              title="Billing Document"
              openLabel={t("booking.openOriginal")}
              emptyLabel={t("booking.documentUnavailable")}
            />
          )}
        </Card>
      )}

      <div className="public-glass-card flex items-center justify-between gap-3 rounded-[1.5rem] p-4">
        <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
          <CalendarClock className="h-4 w-4 text-[hsl(var(--primary))]" />
          <span>{t("booking.reviewLookup.subtitle")}</span>
        </div>
        <Link href={`/${locale}/book`}>
          <Button variant="outline" className="public-outline-button rounded-full">
            <ArrowLeft className="h-4 w-4" />
            {t("booking.backToBooking")}
          </Button>
        </Link>
      </div>
      </div>
    </section>
  );
}

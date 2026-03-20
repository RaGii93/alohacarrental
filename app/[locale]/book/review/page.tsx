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
import { ArrowLeft, MapPin, Search } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tenant = getTenantConfig();
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
    <div className="mx-auto max-w-3xl space-y-6 px-4 pb-12 pt-32 sm:px-6 lg:px-8">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-2">{t("booking.reviewLookup.title")}</h1>
        <p className="text-muted-foreground mb-4">{t("booking.reviewLookup.subtitle")}</p>
        <form className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            name="code"
            defaultValue={lookupValue}
            placeholder={t("booking.reviewLookup.placeholder")}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <Button type="submit">
            <Search className="h-4 w-4" />
            {t("booking.reviewLookup.submit")}
          </Button>
        </form>
      </Card>

      {lookupValue && !booking && (
        <Card className="p-6 text-sm text-red-700">
          {t("booking.reviewLookup.notFound")}
        </Card>
      )}

      {booking && (
        <Card className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">{t("booking.reviewLookup.detailsTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("booking.bookingCode")}: {booking.bookingCode}</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
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
                    <a href={pickupMapUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
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
                    <a href={dropoffMapUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
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

      <div>
        <Link href={`/${locale}/book`}>
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            {t("booking.backToBooking")}
          </Button>
        </Link>
      </div>
    </div>
  );
}

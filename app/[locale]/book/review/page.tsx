import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { DocumentPreview } from "@/components/shared/DocumentPreview";

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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
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
          <Button type="submit">{t("booking.reviewLookup.submit")}</Button>
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
              <dd className="font-medium">{new Date(booking.startDate).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-muted-foreground">{t("booking.endDate")}</dt>
              <dd className="font-medium">{new Date(booking.endDate).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-muted-foreground">{t("booking.pickupLocation")}</dt>
              <dd className="font-medium">
                {booking.pickupLocationRef?.name || booking.pickupLocation || "-"}
                {pickupMapUrl && (
                  <>
                    {" "}
                    <a href={pickupMapUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      ({t("booking.map")})
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
                      ({t("booking.map")})
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
        </Card>
      )}

      <div>
        <Link href={`/${locale}/book`}>
          <Button variant="outline">{t("booking.backToBooking")}</Button>
        </Link>
      </div>
    </div>
  );
}

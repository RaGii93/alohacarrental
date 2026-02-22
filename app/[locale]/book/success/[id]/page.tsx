import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { db } from "@/lib/db";

export default async function SuccessPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations();

  const booking = await db.booking.findUnique({
    where: { id },
    include: { vehicle: true },
  });

  if (!booking) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold">{t("errors.notFound")}</h1>
      </div>
    );
  }

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
          {t("booking.success.message", { orderId: booking.id })}
        </p>

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
              <dt className="text-gray-600">{t("booking.selectVehicle")}:</dt>
              <dd className="font-medium">{booking.vehicle.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">{t("booking.startDate")}:</dt>
              <dd className="font-medium">
                {new Date(booking.startDate).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">{t("booking.endDate")}:</dt>
              <dd className="font-medium">
                {new Date(booking.endDate).toLocaleDateString()}
              </dd>
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
            <Button variant="outline">{t("nav.home")}</Button>
          </Link>
          <Link href={`/${locale}/book`}>
            <Button>{t("nav.booking")}</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

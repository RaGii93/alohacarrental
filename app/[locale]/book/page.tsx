import { useTranslations } from "next-intl";
import { BookingForm } from "@/components/booking/BookingForm";
import { db } from "@/lib/db";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Fetch active vehicles
  const vehicles = await db.vehicle.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, dailyRate: true },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <BookingForm locale={locale} vehicles={vehicles} />
    </div>
  );
}

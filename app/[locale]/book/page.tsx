import { BookingWizard } from "@/components/booking/BookingWizard";
import { db } from "@/lib/db";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();

  // Fetch predefined pickup/dropoff locations
  const locations = await db.location.findMany({
    select: { id: true, name: true, code: true, address: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-4 flex justify-end">
        <Link href={`/${locale}/book/review`}>
          <Button variant="outline">{t("booking.reviewLookup.cta")}</Button>
        </Link>
      </div>
      <BookingWizard locale={locale} locations={locations} />
    </div>
  );
}

import { BookingWizard } from "@/components/booking/BookingWizard";
import { db } from "@/lib/db";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Fetch predefined pickup/dropoff locations
  const locations = await db.location.findMany({ select: { id: true, name: true, code: true, address: true } });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <BookingWizard locale={locale} locations={locations} />
    </div>
  );
}

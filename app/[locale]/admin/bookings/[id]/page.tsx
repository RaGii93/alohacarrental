import { requireAdmin } from "@/lib/auth-guards";
import { isLicenseActive } from "@/lib/license";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { BookingDetailClient } from "@/components/admin/BookingDetailClient";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  // Check admin access
  const admin = await requireAdmin(locale);

  // Check license
  const licenseActive = isLicenseActive();
  if (!licenseActive && admin.role !== "ROOT") {
    redirect(`/${locale}/admin/billing-required`);
  }

  const booking = await db.booking.findUnique({
    where: { id },
    include: { vehicle: true },
  });

  if (!booking) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p>Booking not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href={`/${locale}/admin`}>
        <button className="text-blue-600 hover:underline mb-6">← Back</button>
      </Link>

      <BookingDetailClient booking={booking} locale={locale} />
    </div>
  );
}

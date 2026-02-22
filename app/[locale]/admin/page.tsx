import { useTranslations } from "next-intl";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guards";
import { isLicenseActive } from "@/lib/license";
import { db } from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingsTable } from "@/components/admin/BookingsTable";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Check admin access
  const admin = await requireAdmin(locale);

  // Check license
  const licenseActive = isLicenseActive();
  if (!licenseActive && admin.role !== "ROOT") {
    redirect(`/${locale}/admin/billing-required`);
  }

  // Fetch bookings
  const pending = await db.booking.findMany({
    where: { status: "PENDING" },
    include: { vehicle: true },
    orderBy: { createdAt: "desc" },
  });

  const confirmed = await db.booking.findMany({
    where: { status: "CONFIRMED" },
    include: { vehicle: true },
    orderBy: { createdAt: "desc" },
  });

  const declined = await db.booking.findMany({
    where: { status: "DECLINED" },
    include: { vehicle: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({confirmed.length})</TabsTrigger>
          <TabsTrigger value="declined">Declined ({declined.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <BookingsTable bookings={pending} locale={locale} status="PENDING" />
        </TabsContent>

        <TabsContent value="confirmed">
          <BookingsTable bookings={confirmed} locale={locale} status="CONFIRMED" />
        </TabsContent>

        <TabsContent value="declined">
          <BookingsTable bookings={declined} locale={locale} status="DECLINED" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

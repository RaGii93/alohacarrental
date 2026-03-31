import { redirect } from "next/navigation";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { db } from "@/lib/db";
import { getTenantConfig } from "@/lib/tenant";
import { getBookingRuleSettings, getMinBookingDays, getTaxPercentage, getVehicleRatesIncludeTax } from "@/lib/settings";
import { requireAdminSection } from "@/app/[locale]/admin/_lib";
import { getCategoryFeatureNames } from "@/lib/vehicle-features";

export default async function AdminNewBookingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const auth = await requireAdminSection(locale, "bookings");

  if (auth.admin.role !== "ROOT" && auth.admin.role !== "OWNER") {
    redirect(`/${locale}/admin/bookings`);
  }

  const [tenant, taxPercentage, minimumBookingDays, bookingRules, vehicleRatesIncludeTax, locations, categories] = await Promise.all([
    getTenantConfig(),
    getTaxPercentage(),
    getMinBookingDays(),
    getBookingRuleSettings(),
    getVehicleRatesIncludeTax(),
    db.location.findMany({
      select: { id: true, name: true, code: true, address: true },
      orderBy: { name: "asc" },
    }),
    db.vehicleCategory.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        dailyRate: true,
        seats: true,
        transmission: true,
        hasAC: true,
        hasCarPlay: true,
        hasBackupCamera: true,
        features: { include: { feature: true }, orderBy: { feature: { sortOrder: "asc" } } },
      },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  let extras: Array<{ id: string; name: string; pricingType: "DAILY" | "FLAT"; amount: number; description?: string | null }> = [];
  if ((db as any).extra && typeof (db as any).extra.findMany === "function") {
    try {
      extras = await (db as any).extra.findMany({
        where: { isActive: true },
        select: { id: true, name: true, pricingType: true, amount: true, description: true },
        orderBy: { name: "asc" },
      });
    } catch {
      extras = [];
    }
  } else {
    try {
      extras = await db.$queryRaw<Array<any>>`
        SELECT id, name, "pricingType", amount, description
        FROM "Extra"
        WHERE "isActive" = true
        ORDER BY name ASC
      `;
    } catch {
      extras = [];
    }
  }

  return (
    <section className="bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(236,244,255,0.98))]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <BookingWizard
          locale={locale}
          locations={locations}
          extras={extras}
          categories={categories.map((category) => ({ ...category, features: getCategoryFeatureNames(category) })) as any}
          taxPercentage={taxPercentage}
          vehicleRatesIncludeTax={vehicleRatesIncludeTax}
          minimumBookingDays={minimumBookingDays}
          bookingRuleSettings={bookingRules}
          termsPdfUrl={tenant.termsPdfUrl}
          bookingSource="admin"
        />
      </div>
    </section>
  );
}

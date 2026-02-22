import { requireAdmin } from "@/lib/auth-guards";
import { isLicenseActive } from "@/lib/license";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { VehiclesTable } from "@/components/admin/VehiclesTable";

export default async function VehiclesPage({
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

  // Fetch vehicles
  const vehicles = await db.vehicle.findMany({
    include: {
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });
  const categories = await db.vehicleCategory.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { sortOrder: "asc" },
  });

  // Transform vehicles to match Vehicle type (null -> undefined)
  const transformedVehicles = vehicles.map((vehicle) => ({
    ...vehicle,
    plateNumber: vehicle.plateNumber ?? undefined,
    category: vehicle.category?.name ?? undefined,
    notes: vehicle.notes ?? undefined,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Manage Vehicles</h1>
      <VehiclesTable vehicles={transformedVehicles} categories={categories} locale={locale} />
    </div>
  );
}

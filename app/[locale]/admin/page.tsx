import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guards";
import { isLicenseActive } from "@/lib/license";
import { db } from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingsTable } from "@/components/admin/BookingsTable";
import { VehiclesTable } from "@/components/admin/VehiclesTable";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const tOr = (key: string, values: Record<string, any>, fallback: string) =>
    t.has(key as any) ? t(key as any, values as any) : fallback;

  // Check admin access
  const admin = await requireAdmin(locale);

  // Check license
  const licenseActive = isLicenseActive();
  if (!licenseActive && admin.role !== "ROOT") {
    redirect(`/${locale}/admin/billing-required`);
  }
  const adminUser = await db.adminUser.findUnique({
    where: { id: admin.userId },
    select: { email: true },
  });

  const now = new Date();
  const sevenDays = new Date(now);
  sevenDays.setDate(sevenDays.getDate() + 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch bookings by status
  const pending = await db.booking.findMany({
    where: { status: "PENDING" },
    include: { vehicle: true, category: true },
    orderBy: { createdAt: "desc" },
  });

  const confirmed = await db.booking.findMany({
    where: { status: "CONFIRMED" },
    include: { vehicle: true, category: true },
    orderBy: { createdAt: "desc" },
  });

  const declined = await db.booking.findMany({
    where: { status: "DECLINED" },
    include: { vehicle: true, category: true },
    orderBy: { createdAt: "desc" },
  });

  // Operational dashboards
  const deliveries = await db.booking.findMany({
    where: {
      status: "CONFIRMED",
      startDate: { gte: now, lte: sevenDays },
    },
    include: { vehicle: true, category: true, pickupLocationRef: true },
    orderBy: { startDate: "asc" },
  });
  const returns = await db.booking.findMany({
    where: {
      status: "CONFIRMED",
      endDate: { gte: now, lte: sevenDays },
    },
    include: { vehicle: true, category: true, dropoffLocationRef: true },
    orderBy: { endDate: "asc" },
  });

  // Financial dashboard
  const [confirmedRevenueAgg, pendingPipelineAgg, monthRevenueAgg] = await Promise.all([
    db.booking.aggregate({ where: { status: "CONFIRMED" }, _sum: { totalAmount: true } }),
    db.booking.aggregate({ where: { status: "PENDING" }, _sum: { totalAmount: true } }),
    db.booking.aggregate({ where: { status: "CONFIRMED", createdAt: { gte: monthStart } }, _sum: { totalAmount: true } }),
  ]);

  // Fleet dashboard
  const [totalVehicles, activeVehicles, maintenanceVehicles, inactiveVehicles] = await Promise.all([
    db.vehicle.count(),
    db.vehicle.count({ where: { status: "ACTIVE" } }),
    db.vehicle.count({ where: { status: "MAINTENANCE" } }),
    db.vehicle.count({ where: { status: "INACTIVE" } }),
  ]);
  const onRentNow = await db.booking.count({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      startDate: { lte: now },
      endDate: { gt: now },
      holdExpiresAt: { gt: now },
    },
  });
  const expectedDemandByCategory = await db.booking.groupBy({
    by: ["categoryId"],
    where: { status: { in: ["PENDING", "CONFIRMED"] }, startDate: { gte: now, lte: sevenDays } },
    _count: { _all: true },
  });
  const categories = await db.vehicleCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  const categoryNameMap = new Map(categories.map((category) => [category.id, category.name]));

  // Vehicle management tab data
  const vehicleRows = await db.vehicle.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  const transformedVehicles = vehicleRows.map((vehicle) => ({
    ...vehicle,
    plateNumber: vehicle.plateNumber ?? undefined,
    category: vehicle.category?.name ?? undefined,
    notes: vehicle.notes ?? undefined,
  }));
  const vehicleCategories = categories.map((category) => ({ id: category.id, name: category.name }));

  const currency = (amountCents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amountCents / 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("admin.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tOr("admin.dashboard.header.welcome", { user: adminUser?.email || admin.userId }, `Welcome, ${adminUser?.email || admin.userId}`)}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {tOr("admin.dashboard.header.role", { role: admin.role }, `Role: ${admin.role}`)}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${licenseActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {licenseActive ? t("admin.dashboard.header.licenseActive") : t("admin.dashboard.header.licenseSuspended")}
            </span>
          </div>
        </div>
        <form action={logoutAction.bind(null, locale)}>
          <Button type="submit" variant="outline">
            {t("nav.logout")}
          </Button>
        </form>
      </div>

      <Tabs defaultValue="bookings" className="w-full">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="bookings">{t("admin.dashboard.tabs.bookings")}</TabsTrigger>
          <TabsTrigger value="deliveries">{t("admin.dashboard.tabs.deliveries")}</TabsTrigger>
          <TabsTrigger value="returns">{t("admin.dashboard.tabs.returns")}</TabsTrigger>
          <TabsTrigger value="financial">{t("admin.dashboard.tabs.financial")}</TabsTrigger>
          <TabsTrigger value="fleet">{t("admin.dashboard.tabs.fleet")}</TabsTrigger>
          <TabsTrigger value="vehicles">{t("admin.dashboard.tabs.vehicles")}</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-6">
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">{t("admin.tabs.pending")} ({pending.length})</TabsTrigger>
              <TabsTrigger value="confirmed">{t("admin.tabs.confirmed")} ({confirmed.length})</TabsTrigger>
              <TabsTrigger value="declined">{t("admin.tabs.declined")} ({declined.length})</TabsTrigger>
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
        </TabsContent>

        <TabsContent value="deliveries" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">{t("admin.dashboard.deliveries.title")}</h2>
          <BookingsTable bookings={deliveries} locale={locale} status="CONFIRMED" />
        </TabsContent>

        <TabsContent value="returns" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">{t("admin.dashboard.returns.title")}</h2>
          <BookingsTable bookings={returns} locale={locale} status="CONFIRMED" />
        </TabsContent>

        <TabsContent value="financial" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">{t("admin.dashboard.financial.title")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">{t("admin.dashboard.financial.confirmedRevenue")}</p>
              <p className="text-2xl font-bold">{currency(confirmedRevenueAgg._sum.totalAmount ?? 0)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">{t("admin.dashboard.financial.pendingPipeline")}</p>
              <p className="text-2xl font-bold">{currency(pendingPipelineAgg._sum.totalAmount ?? 0)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">{t("admin.dashboard.financial.monthRevenue")}</p>
              <p className="text-2xl font-bold">{currency(monthRevenueAgg._sum.totalAmount ?? 0)}</p>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fleet" className="mt-6 space-y-6">
          <h2 className="text-xl font-semibold">{t("admin.dashboard.fleet.title")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">{t("admin.dashboard.fleet.totalVehicles")}</p>
              <p className="text-2xl font-bold">{totalVehicles}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">{t("admin.dashboard.fleet.activeVehicles")}</p>
              <p className="text-2xl font-bold">{activeVehicles}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">{t("admin.dashboard.fleet.maintenanceVehicles")}</p>
              <p className="text-2xl font-bold">{maintenanceVehicles}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">{t("admin.dashboard.fleet.inactiveVehicles")}</p>
              <p className="text-2xl font-bold">{inactiveVehicles}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">{t("admin.dashboard.fleet.onRentNow")}</p>
              <p className="text-2xl font-bold">{onRentNow}</p>
            </Card>
          </div>
          <Card className="p-4">
            <p className="font-semibold mb-2">{t("admin.dashboard.fleet.expectedDemand")}</p>
            <div className="space-y-1">
              {expectedDemandByCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("admin.dashboard.fleet.noExpectedDemand")}</p>
              ) : (
                expectedDemandByCategory.map((row) => (
                  <p key={row.categoryId} className="text-sm">
                    {categoryNameMap.get(row.categoryId) || row.categoryId}: {row._count._all}
                  </p>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles" className="mt-6">
          <Tabs defaultValue="manage">
            <TabsList>
              <TabsTrigger value="manage">{t("admin.dashboard.vehicles.manage")}</TabsTrigger>
              <TabsTrigger value="pricing">{t("admin.dashboard.vehicles.pricing")}</TabsTrigger>
            </TabsList>
            <TabsContent value="manage" className="mt-4">
              <VehiclesTable vehicles={transformedVehicles} categories={vehicleCategories} locale={locale} />
            </TabsContent>
            <TabsContent value="pricing" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <Card key={category.id} className="p-4">
                    <p className="font-semibold">{category.name}</p>
                    <p className="text-sm text-muted-foreground">{category.description || "-"}</p>
                    <p className="mt-2 text-lg font-bold">{currency(category.dailyRate)}</p>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}

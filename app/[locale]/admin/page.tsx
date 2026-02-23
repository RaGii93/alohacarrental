import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guards";
import { isLicenseActive } from "@/lib/license";
import { db } from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingsTable } from "@/components/admin/BookingsTable";
import { VehiclesTable } from "@/components/admin/VehiclesTable";
import { CategoriesTable } from "@/components/admin/CategoriesTable";
import { ExtrasTable } from "@/components/admin/ExtrasTable";
import { DiscountCodesTable } from "@/components/admin/DiscountCodesTable";
import { ReviewsTable } from "@/components/admin/ReviewsTable";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth";
import { getBlobProxyUrl } from "@/lib/blob";
import { formatDateTime } from "@/lib/datetime";
import { FinancialFilters } from "@/components/admin/FinancialFilters";

export default async function AdminDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ start?: string; end?: string; tab?: string }>;
}) {
  const { locale } = await params;
  const { start, end, tab } = await searchParams;
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
  const parseDateInput = (value: string | undefined, endOfDay: boolean) => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return null;
    if (endOfDay) parsed.setHours(23, 59, 59, 999);
    return parsed;
  };
  const toInputDate = (value: Date) => {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };
  let financialStartDate = parseDateInput(start, false) || monthStart;
  let financialEndDate = parseDateInput(end, true) || now;
  if (financialStartDate > financialEndDate) {
    const tmp = financialStartDate;
    financialStartDate = new Date(financialEndDate);
    financialEndDate = new Date(tmp);
  }
  const financialStartInput = toInputDate(financialStartDate);
  const financialEndInput = toInputDate(financialEndDate);
  const inFinancialRange = (value: Date | string) => {
    const dt = new Date(value);
    return dt >= financialStartDate && dt <= financialEndDate;
  };

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
  const [confirmedRevenueAgg, pendingPipelineAgg, monthRevenueAgg, paidRevenueAgg] = await Promise.all([
    db.booking.aggregate({
      where: { status: "CONFIRMED", createdAt: { gte: financialStartDate, lte: financialEndDate } },
      _sum: { totalAmount: true },
    }),
    db.booking.aggregate({
      where: { status: "PENDING", createdAt: { gte: financialStartDate, lte: financialEndDate } },
      _sum: { totalAmount: true },
    }),
    db.booking.aggregate({
      where: { status: "CONFIRMED", createdAt: { gte: financialStartDate, lte: financialEndDate } },
      _sum: { totalAmount: true },
    }),
    db.booking.aggregate({
      where: { invoiceUrl: { not: null }, createdAt: { gte: financialStartDate, lte: financialEndDate } },
      _sum: { totalAmount: true },
    }),
  ]);
  const confirmedInRange = confirmed.filter((b) => inFinancialRange(b.createdAt));
  const pendingInRange = pending.filter((b) => inFinancialRange(b.createdAt));
  const confirmedCount = confirmedInRange.length;
  const paidConfirmedCount = confirmedInRange.filter((b) => !!(b as any).invoiceUrl).length;
  const unpaidConfirmedCount = confirmedCount - paidConfirmedCount;
  const avgConfirmedValue = confirmedCount > 0 ? Math.round((confirmedRevenueAgg._sum.totalAmount ?? 0) / confirmedCount) : 0;
  const conversionRate =
    pendingInRange.length + confirmedInRange.length > 0
      ? Math.round((confirmedInRange.length / (pendingInRange.length + confirmedInRange.length)) * 100)
      : 0;
  const recentInvoices = await db.booking.findMany({
    where: { invoiceUrl: { not: null }, createdAt: { gte: financialStartDate, lte: financialEndDate } },
    select: {
      id: true,
      bookingCode: true,
      customerName: true,
      customerEmail: true,
      totalAmount: true,
      invoiceUrl: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  // Fleet dashboard
  const [totalVehicles, activeVehicles, maintenanceVehicles, inactiveVehicles] = await Promise.all([
    db.vehicle.count(),
    db.vehicle.count({ where: { status: "ACTIVE" } }),
    db.vehicle.count({ where: { status: "MAINTENANCE" } }),
    db.vehicle.count({ where: { status: "INACTIVE" } }),
  ]);
  let onRentVehicles = 0;
  try {
    const rows = await db.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count
      FROM "Vehicle"
      WHERE "status" = 'ON_RENT'
    `;
    onRentVehicles = rows?.[0]?.count ?? 0;
  } catch {
    // Backward-compatible fallback when ON_RENT enum is not yet available.
    onRentVehicles = 0;
  }
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
  const allCategoryRows = await db.vehicleCategory.findMany({
    include: {
      _count: {
        select: { vehicles: true, bookings: true },
      },
    },
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }],
  });
  const categoryNameMap = new Map(categories.map((category) => [category.id, category.name]));
  let extras: Array<any> = [];
  if ((db as any).extra && typeof (db as any).extra.findMany === "function") {
    try {
      extras = await (db as any).extra.findMany({ orderBy: { createdAt: "desc" } });
    } catch {
      extras = [];
    }
  } else {
    try {
      extras = await db.$queryRaw<Array<any>>`
        SELECT id, name, description, "pricingType", amount, "isActive", "createdAt"
        FROM "Extra"
        ORDER BY "createdAt" DESC
      `;
    } catch {
      extras = [];
    }
  }

  let discountCodes: Array<any> = [];
  if ((db as any).discountCode && typeof (db as any).discountCode.findMany === "function") {
    try {
      discountCodes = await (db as any).discountCode.findMany({ orderBy: { createdAt: "desc" } });
    } catch {
      discountCodes = [];
    }
  } else {
    try {
      discountCodes = await db.$queryRaw<Array<any>>`
        SELECT id, code, description, percentage, "isActive", "maxUses", "usedCount", "expiresAt", "createdAt"
        FROM "DiscountCode"
        ORDER BY "createdAt" DESC
      `;
    } catch {
      discountCodes = [];
    }
  }
  const utilizationPct = totalVehicles > 0 ? Math.round((onRentVehicles / totalVehicles) * 100) : 0;
  const returnsToday = returns.filter((booking) => {
    const d = new Date(booking.endDate);
    return d.toDateString() === now.toDateString();
  }).length;
  const topDemand = [...expectedDemandByCategory].sort((a, b) => b._count._all - a._count._all).slice(0, 3);

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
  const reviews = await db.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

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

      <Tabs
        defaultValue={
          tab && ["bookings", "deliveries", "returns", "financial", "fleet", "vehicles", "reviews"].includes(tab)
            ? tab
            : "bookings"
        }
        className="w-full"
      >
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="bookings">{t("admin.dashboard.tabs.bookings")}</TabsTrigger>
          <TabsTrigger value="deliveries">{t("admin.dashboard.tabs.deliveries")}</TabsTrigger>
          <TabsTrigger value="returns">{t("admin.dashboard.tabs.returns")}</TabsTrigger>
          <TabsTrigger value="financial">{t("admin.dashboard.tabs.financial")}</TabsTrigger>
          <TabsTrigger value="fleet">{t("admin.dashboard.tabs.fleet")}</TabsTrigger>
          <TabsTrigger value="vehicles">{t("admin.dashboard.tabs.vehicles")}</TabsTrigger>
          <TabsTrigger value="reviews">{t("admin.dashboard.tabs.reviews")}</TabsTrigger>
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
          <BookingsTable bookings={deliveries} locale={locale} status="CONFIRMED" dateMode="pickup" />
        </TabsContent>

        <TabsContent value="returns" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">{t("admin.dashboard.returns.title")}</h2>
          <BookingsTable bookings={returns} locale={locale} status="CONFIRMED" dateMode="dropoff" />
        </TabsContent>

        <TabsContent value="financial" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">{t("admin.dashboard.financial.title")}</h2>
          <FinancialFilters initialStart={financialStartInput} initialEnd={financialEndInput} />
          <p className="mb-4 text-xs text-muted-foreground">
            Filter range: {formatDateTime(financialStartDate)} to {formatDateTime(financialEndDate)}
          </p>
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
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-emerald-50 to-white">
              <p className="text-sm text-muted-foreground">Collected Revenue</p>
              <p className="text-xl font-bold">{currency(paidRevenueAgg._sum.totalAmount ?? 0)}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-amber-50 to-white">
              <p className="text-sm text-muted-foreground">Unpaid Confirmed</p>
              <p className="text-xl font-bold">{unpaidConfirmedCount}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-white">
              <p className="text-sm text-muted-foreground">Average Booking</p>
              <p className="text-xl font-bold">{currency(avgConfirmedValue)}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-violet-50 to-white">
              <p className="text-sm text-muted-foreground">Pending→Confirmed</p>
              <p className="text-xl font-bold">{conversionRate}%</p>
            </Card>
          </div>
          <Card className="mt-4 p-4">
            <p className="font-semibold mb-3">Recent Billing Documents</p>
            <div className="space-y-2">
              {recentInvoices.length === 0 && (
                <p className="text-sm text-muted-foreground">No billing documents yet.</p>
              )}
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium">{inv.bookingCode} · {inv.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {currency(inv.totalAmount)} · {formatDateTime(inv.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <a href={getBlobProxyUrl(inv.invoiceUrl, { download: true }) || undefined} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View PDF</a>
                    <a href={`mailto:${inv.customerEmail}?subject=${encodeURIComponent(`Billing Document ${inv.bookingCode}`)}&body=${encodeURIComponent(`Hello ${inv.customerName},\n\nYour billing document is attached/available at:\n${getBlobProxyUrl(inv.invoiceUrl, { download: true }) || inv.invoiceUrl}\n\nThank you.`)}`} className="text-blue-600 hover:underline">Email client</a>
                  </div>
                </div>
              ))}
            </div>
          </Card>
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
              <p className="text-sm text-muted-foreground">On Rent Vehicles</p>
              <p className="text-2xl font-bold">{onRentVehicles}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-gradient-to-br from-sky-50 to-white">
              <p className="text-sm text-muted-foreground">Fleet Utilization</p>
              <p className="text-2xl font-bold">{utilizationPct}%</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-orange-50 to-white">
              <p className="text-sm text-muted-foreground">Returns Due Today</p>
              <p className="text-2xl font-bold">{returnsToday}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-indigo-50 to-white">
              <p className="text-sm text-muted-foreground">Top Demand Category</p>
              <p className="text-lg font-bold">
                {topDemand[0] ? `${categoryNameMap.get(topDemand[0].categoryId) || topDemand[0].categoryId} (${topDemand[0]._count._all})` : "-"}
              </p>
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
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="extras">Extras</TabsTrigger>
              <TabsTrigger value="discounts">Discounts</TabsTrigger>
            </TabsList>
            <TabsContent value="manage" className="mt-4">
              <VehiclesTable vehicles={transformedVehicles} categories={vehicleCategories} locale={locale} />
            </TabsContent>
            <TabsContent value="pricing" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <Card key={category.id} className="p-4">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl.startsWith("/") ? category.imageUrl : getBlobProxyUrl(category.imageUrl) || category.imageUrl}
                        alt={category.name}
                        className="mb-3 h-32 w-full rounded-md border object-cover"
                      />
                    ) : null}
                    <p className="font-semibold">{category.name}</p>
                    <p className="text-sm text-muted-foreground">{category.description || "-"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {category.seats} seats • {category.transmission === "MANUAL" ? "Manual" : "Automatic"} • {category.hasAC ? "A/C" : "No A/C"}
                    </p>
                    <p className="mt-2 text-lg font-bold">{currency(category.dailyRate)}</p>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="categories" className="mt-4">
              <CategoriesTable categories={allCategoryRows as any} locale={locale} />
            </TabsContent>
            <TabsContent value="extras" className="mt-4">
              <ExtrasTable extras={extras as any} locale={locale} />
            </TabsContent>
            <TabsContent value="discounts" className="mt-4">
              <DiscountCodesTable discountCodes={discountCodes as any} locale={locale} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6 space-y-4">
          <h2 className="text-xl font-semibold">{t("admin.dashboard.reviews.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("admin.dashboard.reviews.subtitle")}</p>
          <ReviewsTable reviews={reviews as any[]} locale={locale} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

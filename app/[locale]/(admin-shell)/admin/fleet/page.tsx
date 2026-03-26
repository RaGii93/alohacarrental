import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { FleetDashboard } from "@/components/admin/FleetDashboard";
import { ADMIN_PAGE_KICKER, ADMIN_PAGE_SHELL, ADMIN_PAGE_STACK, requireAdminSection } from "@/app/[locale]/admin/_lib";

export default async function AdminFleetPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  await requireAdminSection(locale, "fleet");
  const now = new Date();
  const sevenDays = new Date(now);
  sevenDays.setDate(sevenDays.getDate() + 7);
  const [totalVehicles, activeVehicles] = await Promise.all([
    db.vehicle.count(),
    db.vehicle.count({ where: { status: "ACTIVE" } }),
  ]);
  const onRentNow = await db.vehicle.count({ where: { status: "ON_RENT" } as any });
  const deliveriesTotal = await db.booking.count({ where: { status: "CONFIRMED", startDate: { gte: now, lte: sevenDays } } });
  const returnsTotal = await db.booking.count({ where: { status: "CONFIRMED", endDate: { gte: now, lte: sevenDays } } });
  const expectedDemandByCategory = await db.booking.groupBy({
    by: ["categoryId"],
    where: { status: { in: ["PENDING", "CONFIRMED"] }, startDate: { gte: now, lte: sevenDays } },
    _count: { _all: true },
  });
  const categories = await db.vehicleCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  const categoryNameMap = new Map(categories.map((category) => [category.id, category.name]));
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);
  const returnsToday = await db.booking.count({ where: { status: "CONFIRMED", endDate: { gte: dayStart, lte: dayEnd } } });
  const topDemand = [...expectedDemandByCategory].sort((a, b) => b._count._all - a._count._all).slice(0, 1);

  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const previousNow = new Date(now.getTime() - weekMs);
  const previousWeekStart = new Date(previousNow.getTime() - weekMs);
  const previousDayStart = new Date(dayStart.getTime() - weekMs);
  const previousDayEnd = new Date(dayEnd.getTime() - weekMs);
  const [activeVehiclesPrev, onRentNowPrev, returnsTodayPrev, expectedDemandPreviousWeek, deliveriesTotalPrev, returnsTotalPrev, overdueReturns, overdueReturnsPrev] = await Promise.all([
    db.vehicle.count({ where: { status: "ACTIVE", createdAt: { lte: previousNow } } }),
    db.booking.count({
      where: {
        OR: [
          { status: "CONFIRMED", startDate: { lte: previousNow }, endDate: { gt: previousNow } },
          { status: "PENDING", startDate: { lte: previousNow }, endDate: { gt: previousNow }, holdExpiresAt: { gt: previousNow } },
        ],
      },
    }),
    db.booking.count({ where: { status: "CONFIRMED", endDate: { gte: previousDayStart, lte: previousDayEnd } } }),
    db.booking.groupBy({
      by: ["categoryId"],
      where: { status: { in: ["PENDING", "CONFIRMED"] }, startDate: { gte: previousWeekStart, lte: previousNow } },
      _count: { _all: true },
    }),
    db.booking.count({ where: { status: "CONFIRMED", startDate: { gte: previousNow, lte: now } } }),
    db.booking.count({ where: { status: "CONFIRMED", endDate: { gte: previousNow, lte: now } } }),
    db.booking.count({ where: { status: "CONFIRMED", endDate: { lt: now } } }),
    db.booking.count({ where: { status: "CONFIRMED", endDate: { lt: previousNow } } }),
  ]);
  const topDemandPrev = [...expectedDemandPreviousWeek].sort((a, b) => b._count._all - a._count._all).slice(0, 1);
  const topDemandCurrentCount = topDemand[0]?._count._all ?? 0;
  const topDemandPrevCount = topDemandPrev[0]?._count._all ?? 0;
  const expectedDemandTotal = expectedDemandByCategory.reduce((sum, row) => sum + row._count._all, 0);
  const expectedDemandPrevTotal = expectedDemandPreviousWeek.reduce((sum, row) => sum + row._count._all, 0);
  const demandByCategory = expectedDemandByCategory.map((row) => ({ label: categoryNameMap.get(row.categoryId) || row.categoryId, count: row._count._all })).sort((a, b) => b.count - a.count);

  const utilizationPct = totalVehicles > 0 ? Math.round((onRentNow / totalVehicles) * 100) : 0;
  const utilizationPrevPct = activeVehiclesPrev > 0 ? Math.round((onRentNowPrev / activeVehiclesPrev) * 100) : 0;

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_PAGE_STACK}>
      <p className={ADMIN_PAGE_KICKER}>{t("admin.dashboard.fleet.title")}</p>
      <FleetDashboard
        activeVehicles={activeVehicles}
        activeVehiclesPrev={activeVehiclesPrev}
        onRentNow={onRentNow}
        onRentNowPrev={onRentNowPrev}
        utilizationPct={utilizationPct}
        utilizationPrevPct={utilizationPrevPct}
        pickups7d={deliveriesTotal}
        pickups7dPrev={deliveriesTotalPrev}
        returns7d={returnsTotal}
        returns7dPrev={returnsTotalPrev}
        returnsToday={returnsToday}
        returnsTodayPrev={returnsTodayPrev}
        overdueReturns={overdueReturns}
        overdueReturnsPrev={overdueReturnsPrev}
        expectedDemandTotal={expectedDemandTotal}
        expectedDemandPrevTotal={expectedDemandPrevTotal}
        topDemandLabel={topDemand[0] ? `${categoryNameMap.get(topDemand[0].categoryId) || topDemand[0].categoryId} (${topDemand[0]._count._all})` : "-"}
        topDemandCurrentCount={topDemandCurrentCount}
        topDemandPrevCount={topDemandPrevCount}
        demandByCategory={demandByCategory}
      />
      </div>
    </div>
  );
}

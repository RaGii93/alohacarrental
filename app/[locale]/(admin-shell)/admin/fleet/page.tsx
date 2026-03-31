import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { FleetDashboard } from "@/components/admin/FleetDashboard";
import { ADMIN_PAGE_KICKER, ADMIN_PAGE_SHELL, ADMIN_PAGE_STACK, requireAdminSection } from "@/app/[locale]/admin/_lib";

function parseDateParam(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toInputDate(value: Date) {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default async function AdminFleetPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ start?: string; end?: string; fleet_view?: string }>;
}) {
  const { locale } = await params;
  const { start, end, fleet_view } = await searchParams;
  const t = await getTranslations();
  await requireAdminSection(locale, "fleet");
  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setHours(0, 0, 0, 0);
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setDate(defaultEnd.getDate() + 6);
  defaultEnd.setHours(23, 59, 59, 999);

  const selectedStart = parseDateParam(start) || defaultStart;
  const selectedEndBase = parseDateParam(end);
  const selectedEnd = selectedEndBase
    ? new Date(selectedEndBase.getFullYear(), selectedEndBase.getMonth(), selectedEndBase.getDate(), 23, 59, 59, 999)
    : defaultEnd;
  const rangeEnd = selectedEnd >= selectedStart
    ? selectedEnd
    : new Date(selectedStart.getFullYear(), selectedStart.getMonth(), selectedStart.getDate() + 6, 23, 59, 59, 999);
  const rangeEndExclusive = new Date(rangeEnd);
  rangeEndExclusive.setDate(rangeEndExclusive.getDate() + 1);

  const rangeDays = Math.max(
    1,
    Math.round((new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate()).getTime() - selectedStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
  const previousRangeEnd = new Date(selectedStart);
  previousRangeEnd.setMilliseconds(-1);
  const previousRangeStart = new Date(selectedStart);
  previousRangeStart.setDate(previousRangeStart.getDate() - rangeDays);
  previousRangeStart.setHours(0, 0, 0, 0);
  const previousRangeStartInclusive = new Date(previousRangeStart);
  const previousRangeEndInclusive = new Date(previousRangeEnd);

  const [totalVehicles, activeVehicles] = await Promise.all([
    db.vehicle.count(),
    db.vehicle.count({ where: { status: "ACTIVE" } }),
  ]);
  const onRentNow = await db.vehicle.count({ where: { status: "ON_RENT" } as any });
  const deliveriesTotal = await db.booking.count({
    where: { status: "CONFIRMED", startDate: { gte: selectedStart, lte: rangeEnd } },
  });
  const returnsTotal = await db.booking.count({
    where: { status: "CONFIRMED", endDate: { gte: selectedStart, lte: rangeEnd } },
  });
  const expectedDemandByCategory = await db.booking.groupBy({
    by: ["categoryId"],
    where: { status: { in: ["PENDING", "CONFIRMED"] }, startDate: { gte: selectedStart, lte: rangeEnd } },
    _count: { _all: true },
  });
  const [categories, vehicles, bookings, blockouts] = await Promise.all([
    db.vehicleCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    db.vehicle.findMany({
      orderBy: [{ status: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        plateNumber: true,
        status: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    }),
    db.booking.findMany({
      where: {
        vehicleId: { not: null },
        status: { in: ["PENDING", "CONFIRMED"] },
        startDate: { lt: rangeEndExclusive },
        endDate: { gt: selectedStart },
      },
      orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        vehicleId: true,
        bookingCode: true,
        customerName: true,
        startDate: true,
        endDate: true,
        status: true,
        deliveredAt: true,
        returnedAt: true,
        pickupLocation: true,
        dropoffLocation: true,
        pickupLocationRef: { select: { name: true } },
        dropoffLocationRef: { select: { name: true } },
      },
    }),
    db.vehicleBlockout.findMany({
      where: {
        startDate: { lt: rangeEndExclusive },
        endDate: { gt: selectedStart },
      },
      orderBy: [{ startDate: "asc" }],
      select: {
        id: true,
        vehicleId: true,
        startDate: true,
        endDate: true,
        note: true,
      },
    }),
  ]);
  const categoryNameMap = new Map(categories.map((category) => [category.id, category.name]));
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);
  const returnsToday = await db.booking.count({ where: { status: "CONFIRMED", endDate: { gte: dayStart, lte: dayEnd } } });
  const topDemand = [...expectedDemandByCategory].sort((a, b) => b._count._all - a._count._all).slice(0, 1);

  const comparisonDaysMs = rangeDays * 24 * 60 * 60 * 1000;
  const previousNow = new Date(now.getTime() - comparisonDaysMs);
  const previousDayStart = new Date(dayStart.getTime() - comparisonDaysMs);
  const previousDayEnd = new Date(dayEnd.getTime() - comparisonDaysMs);
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
      where: { status: { in: ["PENDING", "CONFIRMED"] }, startDate: { gte: previousRangeStartInclusive, lte: previousRangeEndInclusive } },
      _count: { _all: true },
    }),
    db.booking.count({ where: { status: "CONFIRMED", startDate: { gte: previousRangeStartInclusive, lte: previousRangeEndInclusive } } }),
    db.booking.count({ where: { status: "CONFIRMED", endDate: { gte: previousRangeStartInclusive, lte: previousRangeEndInclusive } } }),
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
        locale={locale}
        initialView={fleet_view === "operations" || fleet_view === "forecast" ? fleet_view : "calendar"}
        initialStart={toInputDate(selectedStart)}
        initialEnd={toInputDate(new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate()))}
        activeVehicles={activeVehicles}
        activeVehiclesPrev={activeVehiclesPrev}
        onRentNow={onRentNow}
        onRentNowPrev={onRentNowPrev}
        utilizationPct={utilizationPct}
        utilizationPrevPct={utilizationPrevPct}
        pickupsInRange={deliveriesTotal}
        pickupsInRangePrev={deliveriesTotalPrev}
        returnsInRange={returnsTotal}
        returnsInRangePrev={returnsTotalPrev}
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
        vehicles={vehicles.map((vehicle) => ({
          id: vehicle.id,
          name: vehicle.name,
          plateNumber: vehicle.plateNumber,
          status: vehicle.status,
          categoryName: vehicle.category?.name || "-",
        }))}
        bookings={bookings.map((booking) => {
          const displayStatus =
            booking.status === "PENDING"
              ? "PENDING"
              : booking.returnedAt || booking.endDate < now
                ? "COMPLETED"
                : booking.deliveredAt || (booking.startDate <= now && booking.endDate > now)
                  ? "ACTIVE"
                  : "CONFIRMED";

          return {
            id: booking.id,
            vehicleId: booking.vehicleId!,
            bookingCode: booking.bookingCode,
            customerName: booking.customerName,
            startDate: booking.startDate.toISOString(),
            endDate: booking.endDate.toISOString(),
            pickupLocation: booking.pickupLocationRef?.name || booking.pickupLocation || null,
            dropoffLocation: booking.dropoffLocationRef?.name || booking.dropoffLocation || null,
            displayStatus,
          };
        })}
        blockouts={blockouts.map((blockout) => ({
          id: blockout.id,
          vehicleId: blockout.vehicleId,
          startDate: blockout.startDate.toISOString(),
          endDate: blockout.endDate.toISOString(),
          note: blockout.note,
        }))}
      />
      </div>
    </div>
  );
}

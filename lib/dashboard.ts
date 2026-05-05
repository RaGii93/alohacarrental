import { BookingStatus, VehicleStatus } from "@prisma/client";
import { addLaPazDays, createLaPazDate, getLaPazDateTimeParts, startOfLaPazDay } from "@/lib/timezone";
import { db } from "@/lib/db";

export type DashboardKpis = {
  bookingsToday: number;
  activeRentalsNow: number;
  vehiclesAvailableNow: number;
  vehiclesInMaintenance: number;
  unpaidInvoicesCount: number;
  revenueToday: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  utilizationRate: number;
  averageBookingValue: number;
};

export type TrendPoint = {
  date: string;
  label: string;
  revenue: number;
  bookings: number;
};

export type CategoryPerformancePoint = {
  categoryId: string;
  categoryName: string;
  bookings: number;
  revenue: number;
};

export type VehicleRevenuePoint = {
  vehicleId: string;
  vehicleName: string;
  revenue: number;
  bookings: number;
};

export type OccupancyPoint = {
  categoryId: string;
  categoryName: string;
  activeVehicles: number;
  rentalsNow: number;
  utilizationRate: number;
};

export type DashboardAlert = {
  id: string;
  type: "critical" | "warning" | "info";
  title: string;
  description: string;
  count: number;
};

function getTimeContext() {
  const now = new Date();
  const parts = getLaPazDateTimeParts(now);
  const todayStart = startOfLaPazDay(now);
  const tomorrowStart = addLaPazDays(todayStart, 1);
  const last30Start = addLaPazDays(todayStart, -29);
  const monthStart = parts
    ? createLaPazDate({ year: parts.year, month: parts.month, day: 1 })
    : todayStart;
  const previousMonthStart = parts
    ? createLaPazDate({
        year: parts.month === 1 ? parts.year - 1 : parts.year,
        month: parts.month === 1 ? 12 : parts.month - 1,
        day: 1,
      })
    : addLaPazDays(monthStart, -30);

  return {
    now,
    nowPlus24h: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    todayStart,
    tomorrowStart,
    last30Start,
    monthStart,
    previousMonthStart,
  };
}

function toPercent(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function dayLabel(day: Date) {
  return day.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

async function hasColumn(tableName: string, columnName: string) {
  const result = await db.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
        AND column_name = ${columnName}
    ) AS "exists"
  `;

  return Boolean(result[0]?.exists);
}

export async function getDashboardKpis(): Promise<DashboardKpis> {
  const { now, todayStart, tomorrowStart, monthStart, previousMonthStart, last30Start } = getTimeContext();

  const [
    bookingsToday,
    activeRentalsNow,
    activeVehicles,
    vehiclesInMaintenance,
    unpaidInvoicesCount,
    revenueTodayAgg,
    revenueMonthAgg,
    revenueLastMonthAgg,
    averageBookingAgg,
  ] = await Promise.all([
    db.booking.count({
      where: {
        createdAt: { gte: todayStart, lt: tomorrowStart },
      },
    }),
    db.booking.count({
      where: {
        status: BookingStatus.CONFIRMED,
        startDate: { lte: now },
        endDate: { gt: now },
      },
    }),
    db.vehicle.count({ where: { status: VehicleStatus.ACTIVE } }),
    db.vehicle.count({ where: { status: VehicleStatus.MAINTENANCE } }),
    db.booking.count({
      where: {
        status: BookingStatus.CONFIRMED,
        paymentReceivedAt: null,
        billingDocumentType: { not: null },
      },
    }),
    db.booking.aggregate({
      where: {
        paymentReceivedAt: { gte: todayStart, lt: tomorrowStart },
      },
      _sum: { totalAmount: true },
    }),
    db.booking.aggregate({
      where: {
        paymentReceivedAt: { gte: monthStart, lt: tomorrowStart },
      },
      _sum: { totalAmount: true },
    }),
    db.booking.aggregate({
      where: {
        paymentReceivedAt: { gte: previousMonthStart, lt: monthStart },
      },
      _sum: { totalAmount: true },
    }),
    db.booking.aggregate({
      where: {
        status: BookingStatus.CONFIRMED,
        createdAt: { gte: last30Start },
      },
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
  ]);

  const vehiclesAvailableNow = Math.max(activeVehicles - activeRentalsNow, 0);
  const averageBookingValue = averageBookingAgg._count._all
    ? Math.round((Number(averageBookingAgg._sum.totalAmount || 0) / averageBookingAgg._count._all))
    : 0;

  return {
    bookingsToday,
    activeRentalsNow,
    vehiclesAvailableNow,
    vehiclesInMaintenance,
    unpaidInvoicesCount,
    revenueToday: Number(revenueTodayAgg._sum.totalAmount || 0),
    revenueThisMonth: Number(revenueMonthAgg._sum.totalAmount || 0),
    revenueLastMonth: Number(revenueLastMonthAgg._sum.totalAmount || 0),
    utilizationRate: toPercent(activeRentalsNow, activeVehicles),
    averageBookingValue,
  };
}

export async function getUpcomingPickups(limit = 8) {
  const { now, nowPlus24h } = getTimeContext();
  return db.booking.findMany({
    where: {
      status: BookingStatus.CONFIRMED,
      startDate: { gte: now, lt: nowPlus24h },
    },
    select: {
      id: true,
      bookingCode: true,
      customerName: true,
      startDate: true,
      totalAmount: true,
      paymentReceivedAt: true,
      vehicle: { select: { name: true } },
    },
    orderBy: { startDate: "asc" },
    take: limit,
  });
}

export async function getUpcomingReturns(limit = 8) {
  const { now, nowPlus24h } = getTimeContext();
  return db.booking.findMany({
    where: {
      status: BookingStatus.CONFIRMED,
      endDate: { gte: now, lt: nowPlus24h },
    },
    select: {
      id: true,
      bookingCode: true,
      customerName: true,
      endDate: true,
      totalAmount: true,
      vehicle: { select: { name: true } },
    },
    orderBy: { endDate: "asc" },
    take: limit,
  });
}

export async function getOverdueReturns(limit = 8) {
  const { now } = getTimeContext();
  return db.booking.findMany({
    where: {
      status: BookingStatus.CONFIRMED,
      endDate: { lt: now },
    },
    select: {
      id: true,
      bookingCode: true,
      customerName: true,
      endDate: true,
      vehicle: { select: { name: true } },
    },
    orderBy: { endDate: "asc" },
    take: limit,
  });
}

export async function getRecentBookings(limit = 8) {
  return db.booking.findMany({
    select: {
      id: true,
      bookingCode: true,
      customerName: true,
      status: true,
      totalAmount: true,
      createdAt: true,
      vehicle: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getVehiclesNeedingAttention(limit = 8) {
  const inspectionExists = await hasColumn("Vehicle", "inspectionExpiryDate");
  const insuranceExists = await hasColumn("Vehicle", "insuranceEndDate");
  const soon = addLaPazDays(new Date(), 14);

  return db.vehicle.findMany({
    where: {
      OR: [
        { status: VehicleStatus.MAINTENANCE },
        { status: VehicleStatus.INACTIVE },
        ...(inspectionExists ? [{ inspectionExpiryDate: { lte: soon } } as const] : []),
        ...(insuranceExists ? [{ insuranceEndDate: { lte: soon } } as const] : []),
      ],
    },
    select: {
      id: true,
      name: true,
      plateNumber: true,
      status: true,
      ...(inspectionExists ? ({ inspectionExpiryDate: true } as const) : {}),
      ...(insuranceExists ? ({ insuranceEndDate: true } as const) : {}),
      category: { select: { name: true } },
    },
    orderBy: [{ status: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function getRecentPayments(limit = 8) {
  return db.booking.findMany({
    where: {
      paymentReceivedAt: { not: null },
    },
    select: {
      id: true,
      bookingCode: true,
      customerName: true,
      paymentReceivedAt: true,
      totalAmount: true,
    },
    orderBy: { paymentReceivedAt: "desc" },
    take: limit,
  });
}

export async function getLatestReviewsPendingModeration(limit = 8) {
  return db.review.findMany({
    where: { isVisible: false },
    select: {
      id: true,
      bookingId: true,
      bookingCode: true,
      customerName: true,
      rating: true,
      comment: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getRevenueSeries(days = 30): Promise<TrendPoint[]> {
  const { todayStart, tomorrowStart } = getTimeContext();
  const start = addLaPazDays(todayStart, -(days - 1));

  const rows = await db.$queryRaw<Array<{ day: Date; revenue: bigint | number | null }>>`
    SELECT
      date_trunc('day', "paymentReceivedAt") AS day,
      SUM("totalAmount") AS revenue
    FROM "Booking"
    WHERE "paymentReceivedAt" IS NOT NULL
      AND "paymentReceivedAt" >= ${start}
      AND "paymentReceivedAt" < ${tomorrowStart}
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  const revenueMap = new Map(
    rows.map((row) => [
      startOfLaPazDay(new Date(row.day)).toISOString(),
      Number(row.revenue || 0),
    ]),
  );

  return Array.from({ length: days }, (_, idx) => {
    const day = addLaPazDays(start, idx);
    const key = startOfLaPazDay(day).toISOString();
    return {
      date: key,
      label: dayLabel(day),
      revenue: revenueMap.get(key) ?? 0,
      bookings: 0,
    };
  });
}

export async function getBookingsSeries(days = 30): Promise<TrendPoint[]> {
  const { todayStart, tomorrowStart } = getTimeContext();
  const start = addLaPazDays(todayStart, -(days - 1));

  const rows = await db.$queryRaw<Array<{ day: Date; bookings: bigint | number | null }>>`
    SELECT
      date_trunc('day', "createdAt") AS day,
      COUNT(*) AS bookings
    FROM "Booking"
    WHERE "createdAt" >= ${start}
      AND "createdAt" < ${tomorrowStart}
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  const bookingsMap = new Map(
    rows.map((row) => [
      startOfLaPazDay(new Date(row.day)).toISOString(),
      Number(row.bookings || 0),
    ]),
  );

  return Array.from({ length: days }, (_, idx) => {
    const day = addLaPazDays(start, idx);
    const key = startOfLaPazDay(day).toISOString();
    return {
      date: key,
      label: dayLabel(day),
      revenue: 0,
      bookings: bookingsMap.get(key) ?? 0,
    };
  });
}

export async function getCategoryPerformance(): Promise<CategoryPerformancePoint[]> {
  const { last30Start } = getTimeContext();
  const grouped = await db.booking.groupBy({
    by: ["categoryId"],
    where: {
      status: BookingStatus.CONFIRMED,
      createdAt: { gte: last30Start },
    },
    _count: { _all: true },
    _sum: { totalAmount: true },
    orderBy: { _sum: { totalAmount: "desc" } },
    take: 8,
  });

  const categories = await db.vehicleCategory.findMany({
    where: { id: { in: grouped.map((item) => item.categoryId) } },
    select: { id: true, name: true },
  });
  const categoryMap = new Map(categories.map((item) => [item.id, item.name]));

  return grouped.map((item) => ({
    categoryId: item.categoryId,
    categoryName: categoryMap.get(item.categoryId) || "Unknown",
    bookings: item._count._all,
    revenue: Number(item._sum.totalAmount || 0),
  }));
}

export async function getTopVehiclesByRevenue(): Promise<VehicleRevenuePoint[]> {
  const { last30Start } = getTimeContext();
  const grouped = await db.booking.groupBy({
    by: ["vehicleId"],
    where: {
      status: BookingStatus.CONFIRMED,
      createdAt: { gte: last30Start },
      vehicleId: { not: null },
    },
    _count: { _all: true },
    _sum: { totalAmount: true },
    orderBy: { _sum: { totalAmount: "desc" } },
    take: 8,
  });

  const vehicleIds = grouped.map((item) => item.vehicleId).filter((id): id is string => Boolean(id));
  const vehicles = await db.vehicle.findMany({
    where: { id: { in: vehicleIds } },
    select: { id: true, name: true },
  });
  const vehicleMap = new Map(vehicles.map((item) => [item.id, item.name]));

  return grouped
    .filter((item): item is typeof item & { vehicleId: string } => Boolean(item.vehicleId))
    .map((item) => ({
      vehicleId: item.vehicleId,
      vehicleName: vehicleMap.get(item.vehicleId) || "Unknown",
      revenue: Number(item._sum.totalAmount || 0),
      bookings: item._count._all,
    }));
}

export async function getOccupancyByCategory(): Promise<OccupancyPoint[]> {
  const { now } = getTimeContext();

  const [activeVehiclesByCategory, activeRentalsByCategory, categories] = await Promise.all([
    db.vehicle.groupBy({
      by: ["categoryId"],
      where: { status: VehicleStatus.ACTIVE },
      _count: { _all: true },
    }),
    db.booking.groupBy({
      by: ["categoryId"],
      where: {
        status: BookingStatus.CONFIRMED,
        startDate: { lte: now },
        endDate: { gt: now },
      },
      _count: { _all: true },
    }),
    db.vehicleCategory.findMany({
      select: { id: true, name: true },
    }),
  ]);

  const activeMap = new Map(activeVehiclesByCategory.map((item) => [item.categoryId, item._count._all]));
  const rentalsMap = new Map(activeRentalsByCategory.map((item) => [item.categoryId, item._count._all]));

  return categories
    .map((category) => {
      const activeVehicles = activeMap.get(category.id) || 0;
      const rentalsNow = rentalsMap.get(category.id) || 0;
      return {
        categoryId: category.id,
        categoryName: category.name,
        activeVehicles,
        rentalsNow,
        utilizationRate: toPercent(rentalsNow, activeVehicles),
      };
    })
    .filter((item) => item.activeVehicles > 0)
    .sort((a, b) => b.utilizationRate - a.utilizationRate)
    .slice(0, 8);
}

export async function getCancellationRate() {
  const { last30Start } = getTimeContext();
  const [total, cancelled] = await Promise.all([
    db.booking.count({ where: { createdAt: { gte: last30Start } } }),
    db.booking.count({
      where: {
        createdAt: { gte: last30Start },
        status: { in: [BookingStatus.DECLINED, BookingStatus.CANCELLED] },
      },
    }),
  ]);

  return {
    total,
    cancelled,
    rate: toPercent(cancelled, total),
  };
}

export async function getRepeatCustomerPercentage() {
  const result = await db.$queryRaw<Array<{ total: number; repeat: number }>>`
    WITH grouped AS (
      SELECT
        CASE
          WHEN COALESCE(NULLIF(LOWER("customerEmail"), ''), '') <> '' THEN CONCAT('email:', LOWER("customerEmail"))
          WHEN COALESCE(NULLIF(regexp_replace(COALESCE("customerPhone", ''), '[^0-9+]', '', 'g'), ''), '') <> ''
            THEN CONCAT('phone:', regexp_replace(COALESCE("customerPhone", ''), '[^0-9+]', '', 'g'))
          ELSE CONCAT('name:', LOWER(COALESCE("customerName", 'unknown')))
        END AS customer_key,
        COUNT(*)::int AS bookings
      FROM "Booking"
      GROUP BY 1
    )
    SELECT
      COUNT(*)::int AS total,
      SUM(CASE WHEN bookings >= 2 THEN 1 ELSE 0 END)::int AS repeat
    FROM grouped
  `;

  const total = Number(result[0]?.total || 0);
  const repeat = Number(result[0]?.repeat || 0);

  return {
    total,
    repeat,
    rate: toPercent(repeat, total),
  };
}

export async function getDashboardAlerts(): Promise<DashboardAlert[]> {
  const { now, nowPlus24h } = getTimeContext();
  const soon = addLaPazDays(now, 7);

  const inspectionExists = await hasColumn("Vehicle", "inspectionExpiryDate");
  const insuranceExists = await hasColumn("Vehicle", "insuranceEndDate");

  const [
    overdueReturns,
    unpaidNearPickup,
    inMaintenance,
    lowAvailabilityCategories,
    pendingReviews,
    docsNeedingReview,
  ] = await Promise.all([
    db.booking.count({
      where: {
        status: BookingStatus.CONFIRMED,
        endDate: { lt: now },
      },
    }),
    db.booking.count({
      where: {
        status: BookingStatus.CONFIRMED,
        paymentReceivedAt: null,
        startDate: { gte: now, lte: nowPlus24h },
      },
    }),
    db.vehicle.count({ where: { status: VehicleStatus.MAINTENANCE } }),
    db.$queryRaw<Array<{ count: number }>>`
      WITH fleet AS (
        SELECT "categoryId", COUNT(*)::int AS active_vehicles
        FROM "Vehicle"
        WHERE status = 'ACTIVE'
        GROUP BY 1
      ),
      upcoming AS (
        SELECT "categoryId", COUNT(*)::int AS upcoming_pickups
        FROM "Booking"
        WHERE status = 'CONFIRMED'
          AND "startDate" >= ${now}
          AND "startDate" < ${soon}
        GROUP BY 1
      )
      SELECT COUNT(*)::int AS count
      FROM fleet f
      JOIN upcoming u ON u."categoryId" = f."categoryId"
      WHERE f.active_vehicles <= 2 AND u.upcoming_pickups >= f.active_vehicles
    `,
    db.review.count({ where: { isVisible: false } }),
    inspectionExists || insuranceExists
      ? db.vehicle.count({
          where: {
            OR: [
              ...(inspectionExists ? [{ inspectionExpiryDate: { lte: soon } } as const] : []),
              ...(insuranceExists ? [{ insuranceEndDate: { lte: soon } } as const] : []),
            ],
          },
        })
      : Promise.resolve(0),
  ]);

  const lowAvailability = Number(lowAvailabilityCategories[0]?.count || 0);

  const alerts: DashboardAlert[] = [
    {
      id: "overdue-returns",
      type: "critical",
      title: "Overdue returns",
      description: "Confirmed rentals with return time already passed.",
      count: overdueReturns,
    },
    {
      id: "unpaid-near-pickup",
      type: "warning",
      title: "Unpaid bookings nearing pickup",
      description: "Confirmed bookings in the next 24h without payment.",
      count: unpaidNearPickup,
    },
    {
      id: "vehicles-maintenance",
      type: "warning",
      title: "Vehicles in maintenance",
      description: "Fleet units marked as maintenance.",
      count: inMaintenance,
    },
    {
      id: "docs-review",
      type: "info",
      title: "Vehicle documents to review",
      description: "Insurance/inspection expirations in the next 7 days.",
      count: docsNeedingReview,
    },
    {
      id: "low-availability",
      type: "warning",
      title: "Low fleet availability",
      description: "Categories with demand outpacing active vehicles in 7 days.",
      count: lowAvailability,
    },
    {
      id: "reviews-pending",
      type: "info",
      title: "Reviews awaiting moderation",
      description: "Newly submitted customer reviews pending approval.",
      count: pendingReviews,
    },
  ];

  return alerts.filter((alert) => alert.count > 0);
}

export async function getDashboardData() {
  // This fan-out can be wrapped with unstable_cache or route-segment caching later.
  const [
    kpis,
    upcomingPickups,
    upcomingReturns,
    overdueReturns,
    recentBookings,
    vehiclesNeedingAttention,
    recentPayments,
    pendingReviews,
    revenueSeries,
    bookingsSeries,
    categoryPerformance,
    topVehiclesByRevenue,
    occupancyByCategory,
    cancellation,
    repeatCustomers,
    alerts,
  ] = await Promise.all([
    getDashboardKpis(),
    getUpcomingPickups(),
    getUpcomingReturns(),
    getOverdueReturns(),
    getRecentBookings(),
    getVehiclesNeedingAttention(),
    getRecentPayments(),
    getLatestReviewsPendingModeration(),
    getRevenueSeries(30),
    getBookingsSeries(30),
    getCategoryPerformance(),
    getTopVehiclesByRevenue(),
    getOccupancyByCategory(),
    getCancellationRate(),
    getRepeatCustomerPercentage(),
    getDashboardAlerts(),
  ]);

  return {
    kpis,
    upcomingPickups,
    upcomingReturns,
    overdueReturns,
    recentBookings,
    vehiclesNeedingAttention,
    recentPayments,
    pendingReviews,
    revenueSeries,
    bookingsSeries,
    categoryPerformance,
    topVehiclesByRevenue,
    occupancyByCategory,
    cancellation,
    repeatCustomers,
    alerts,
  };
}

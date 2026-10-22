import type { Prisma } from "@prisma/client";
import { getDashboardTimeContext } from "@/lib/dashboard";

// Keep drill-downs aligned with the time windows used by the dashboard.
export function getDashboardBookingFilter(value: string | undefined): {
  where: Prisma.BookingWhereInput;
  labelKey: string;
  defaultStatus: "pending" | "confirmed";
} | null {
  const { now, nowPlus24h, todayStart, tomorrowStart, monthStart, last30Start } = getDashboardTimeContext();
  switch (value) {
    case "recent":
      return { where: {}, labelKey: "widgets.recentBookings", defaultStatus: "pending" };
    case "payments":
      return { where: { paymentReceivedAt: { not: null } }, labelKey: "widgets.recentPayments", defaultStatus: "confirmed" };
    case "today":
      return { where: { createdAt: { gte: todayStart, lt: tomorrowStart } }, labelKey: "kpis.bookingsToday", defaultStatus: "pending" };
    case "active":
      return { where: { startDate: { lte: now }, endDate: { gt: now } }, labelKey: "kpis.activeRentalsNow", defaultStatus: "confirmed" };
    case "overdue":
      return { where: { endDate: { lt: now } }, labelKey: "widgets.overdueReturns", defaultStatus: "confirmed" };
    case "unpaid":
      return { where: { paymentReceivedAt: null, billingDocumentType: { not: null } }, labelKey: "kpis.unpaidInvoicesCount", defaultStatus: "confirmed" };
    case "unpaid-pickup":
      return { where: { paymentReceivedAt: null, startDate: { gte: now, lt: nowPlus24h } }, labelKey: "widgets.upcomingPickups", defaultStatus: "confirmed" };
    case "pickups":
      return { where: { startDate: { gte: now, lt: nowPlus24h } }, labelKey: "widgets.upcomingPickups", defaultStatus: "confirmed" };
    case "returns":
      return { where: { endDate: { gte: now, lt: nowPlus24h } }, labelKey: "widgets.upcomingReturns", defaultStatus: "confirmed" };
    case "revenue-today":
      return { where: { paymentReceivedAt: { gte: todayStart, lt: tomorrowStart } }, labelKey: "kpis.revenueToday", defaultStatus: "confirmed" };
    case "revenue-month":
      return { where: { paymentReceivedAt: { gte: monthStart, lt: tomorrowStart } }, labelKey: "kpis.revenueThisMonth", defaultStatus: "confirmed" };
    case "average":
      return { where: { createdAt: { gte: last30Start } }, labelKey: "kpis.averageBookingValue", defaultStatus: "confirmed" };
    default:
      return null;
  }
}

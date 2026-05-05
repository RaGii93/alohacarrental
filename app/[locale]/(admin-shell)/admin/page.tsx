import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { formatDateTime } from "@/lib/datetime";
import {
  getDashboardData,
} from "@/lib/dashboard";
import {
  ADMIN_PAGE_KICKER,
  ADMIN_PAGE_SHELL,
  ADMIN_PAGE_STACK,
  requireAdminSection,
} from "@/app/[locale]/admin/_lib";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BookingsTrendChart,
  CategoryPerformanceChart,
  OccupancyChart,
  RevenueTrendChart,
} from "@/components/admin/AdminDashboardCharts";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function percentDelta(current: number, previous: number) {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function signedPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}%`;
}

function longDayLabel(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function AlertTone({ type }: { type: "critical" | "warning" | "info" }) {
  if (type === "critical") return <Badge className="bg-red-100 text-red-700">Critical</Badge>;
  if (type === "warning") return <Badge className="bg-amber-100 text-amber-700">Warning</Badge>;
  return <Badge className="bg-sky-100 text-sky-700">Info</Badge>;
}

export default async function AdminRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin.dashboard.commandCenter");
  await requireAdminSection(locale, "dashboard");

  const data = await getDashboardData();

  const peakBookingDay = data.bookingsSeries.reduce<null | { date: string; bookings: number }>((best, point) => {
    if (!best || point.bookings > best.bookings) return { date: point.date, bookings: point.bookings };
    return best;
  }, null);

  const recent7 = data.bookingsSeries.slice(-7);
  const previous7 = data.bookingsSeries.slice(-14, -7);
  const recent7Total = recent7.reduce((sum, point) => sum + point.bookings, 0);
  const previous7Total = previous7.reduce((sum, point) => sum + point.bookings, 0);
  const projectedNext7Bookings = recent7Total;

  const monthOverMonthRevenue = percentDelta(data.kpis.revenueThisMonth, data.kpis.revenueLastMonth);
  const utilizationInterpretation = data.kpis.utilizationRate < 45
    ? "Low utilization warning"
    : data.kpis.utilizationRate >= 85
      ? "High utilization pressure"
      : "Utilization in normal range";

  const kpiCards = [
    {
      key: "bookingsToday",
      label: t("kpis.bookingsToday"),
      value: String(data.kpis.bookingsToday),
      interpretation: peakBookingDay && peakBookingDay.bookings > 0
        ? `Peak day: ${longDayLabel(peakBookingDay.date)}`
        : null,
    },
    {
      key: "activeRentalsNow",
      label: t("kpis.activeRentalsNow"),
      value: String(data.kpis.activeRentalsNow),
      interpretation: `Projected next 7 days: ${projectedNext7Bookings} bookings`,
    },
    {
      key: "vehiclesAvailableNow",
      label: t("kpis.vehiclesAvailableNow"),
      value: String(data.kpis.vehiclesAvailableNow),
      interpretation: previous7Total > 0
        ? `${signedPercent(percentDelta(recent7Total, previous7Total) || 0)} vs prior 7 days`
        : null,
    },
    {
      key: "vehiclesInMaintenance",
      label: t("kpis.vehiclesInMaintenance"),
      value: String(data.kpis.vehiclesInMaintenance),
    },
    {
      key: "unpaidInvoicesCount",
      label: t("kpis.unpaidInvoicesCount"),
      value: String(data.kpis.unpaidInvoicesCount),
    },
    {
      key: "revenueToday",
      label: t("kpis.revenueToday"),
      value: money(data.kpis.revenueToday),
    },
    {
      key: "revenueThisMonth",
      label: t("kpis.revenueThisMonth"),
      value: money(data.kpis.revenueThisMonth),
      interpretation: monthOverMonthRevenue !== null
        ? `${signedPercent(monthOverMonthRevenue)} vs last month`
        : null,
    },
    {
      key: "utilizationRate",
      label: t("kpis.utilizationRate"),
      value: `${data.kpis.utilizationRate}%`,
      interpretation: utilizationInterpretation,
      interpretationTone: data.kpis.utilizationRate < 45 ? "warning" : "neutral",
    },
    {
      key: "averageBookingValue",
      label: t("kpis.averageBookingValue"),
      value: money(data.kpis.averageBookingValue),
    },
  ];

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_PAGE_STACK}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className={ADMIN_PAGE_KICKER}>{t("kicker")}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{t("title")}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">{t("subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/${locale}/admin/bookings`} className="inline-flex h-9 items-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              {t("actions.manageBookings")}
            </Link>
            <Link href={`/${locale}/admin/fleet`} className="inline-flex h-9 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800">
              {t("actions.openFleet")}
            </Link>
          </div>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {kpiCards.map((card) => (
            <Card key={card.key} className="gap-2 py-4">
              <CardHeader className="px-4 pb-0">
                <CardDescription className="text-xs uppercase tracking-[0.12em]">{card.label}</CardDescription>
                <CardTitle className="text-2xl font-black tracking-tight text-slate-900">{card.value}</CardTitle>
                {card.interpretation ? (
                  <p
                    className={
                      card.interpretationTone === "warning"
                        ? "text-xs font-semibold text-amber-700"
                        : "text-xs font-semibold text-slate-600"
                    }
                  >
                    {card.interpretation}
                  </p>
                ) : null}
              </CardHeader>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>{t("analytics.revenueTrend")}</CardTitle>
              <CardDescription>{t("analytics.last30Days")}</CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueTrendChart data={data.revenueSeries} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("analytics.bookingsTrend")}</CardTitle>
              <CardDescription>{t("analytics.last30Days")}</CardDescription>
            </CardHeader>
            <CardContent>
              <BookingsTrendChart data={data.bookingsSeries} />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>{t("analytics.categoryPerformance")}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.categoryPerformance.length === 0 ? (
                <p className="text-sm text-slate-500">{t("empty.noCategoryPerformance")}</p>
              ) : (
                <CategoryPerformanceChart data={data.categoryPerformance} />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("analytics.occupancyByCategory")}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.occupancyByCategory.length === 0 ? (
                <p className="text-sm text-slate-500">{t("empty.noOccupancy")}</p>
              ) : (
                <OccupancyChart data={data.occupancyByCategory} />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("analytics.executiveRatios")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{t("analytics.cancellationRate")}</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{data.cancellation.rate}%</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{t("analytics.repeatCustomerRate")}</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{data.repeatCustomers.rate}%</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("alerts.title")}</CardTitle>
              <CardDescription>{t("alerts.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.alerts.length === 0 ? (
                <p className="text-sm text-slate-500">{t("empty.noAlerts")}</p>
              ) : (
                data.alerts.map((alert) => (
                  <div key={alert.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">{alert.title}</p>
                      <AlertTone type={alert.type} />
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{alert.description}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{t("alerts.affected", { count: alert.count })}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("widgets.topVehiclesByRevenue")}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.topVehiclesByRevenue.length === 0 ? (
                <p className="text-sm text-slate-500">{t("empty.noTopVehicles")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.vehicle")}</TableHead>
                      <TableHead>{t("table.bookings")}</TableHead>
                      <TableHead>{t("table.revenue")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topVehiclesByRevenue.map((row) => (
                      <TableRow key={row.vehicleId}>
                        <TableCell>{row.vehicleName}</TableCell>
                        <TableCell>{row.bookings}</TableCell>
                        <TableCell>{money(row.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>{t("widgets.upcomingPickups")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.upcomingPickups.length === 0 ? (
                <p className="text-sm text-slate-500">{t("empty.noUpcomingPickups")}</p>
              ) : (
                data.upcomingPickups.map((row) => (
                  <div key={row.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="font-semibold text-slate-900">{row.customerName}</p>
                    <p className="text-xs text-slate-600">#{row.bookingCode} • {row.vehicle?.name || t("table.unassigned")}</p>
                    <p className="text-xs text-slate-600">{formatDateTime(row.startDate)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("widgets.upcomingReturns")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.upcomingReturns.length === 0 ? (
                <p className="text-sm text-slate-500">{t("empty.noUpcomingReturns")}</p>
              ) : (
                data.upcomingReturns.map((row) => (
                  <div key={row.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="font-semibold text-slate-900">{row.customerName}</p>
                    <p className="text-xs text-slate-600">#{row.bookingCode} • {row.vehicle?.name || t("table.unassigned")}</p>
                    <p className="text-xs text-slate-600">{formatDateTime(row.endDate)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("widgets.overdueReturns")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.overdueReturns.length === 0 ? (
                <p className="text-sm text-slate-500">{t("empty.noOverdueReturns")}</p>
              ) : (
                data.overdueReturns.map((row) => (
                  <div key={row.id} className="rounded-xl border border-red-200 bg-red-50/40 p-3">
                    <p className="font-semibold text-red-900">{row.customerName}</p>
                    <p className="text-xs text-red-700">#{row.bookingCode} • {row.vehicle?.name || t("table.unassigned")}</p>
                    <p className="text-xs text-red-700">{formatDateTime(row.endDate)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>{t("widgets.recentBookings")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.recentBookings.length === 0 ? (
                <p className="text-sm text-slate-500">{t("empty.noRecentBookings")}</p>
              ) : (
                data.recentBookings.map((row) => (
                  <div key={row.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="font-semibold text-slate-900">{row.customerName}</p>
                    <p className="text-xs text-slate-600">#{row.bookingCode} • {row.vehicle?.name || t("table.unassigned")}</p>
                    <p className="text-xs text-slate-600">{formatDateTime(row.createdAt)} • {money(row.totalAmount)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("widgets.vehiclesNeedingAttention")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.vehiclesNeedingAttention.length === 0 ? (
                <p className="text-sm text-slate-500">{t("empty.noVehiclesAttention")}</p>
              ) : (
                data.vehiclesNeedingAttention.map((row) => (
                  <div key={row.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="font-semibold text-slate-900">{row.name}</p>
                    <p className="text-xs text-slate-600">{row.plateNumber || "-"} • {row.category?.name || "-"}</p>
                    <p className="text-xs text-slate-600">{row.status}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("widgets.recentPayments")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.recentPayments.length === 0 ? (
                <p className="text-sm text-slate-500">{t("empty.noRecentPayments")}</p>
              ) : (
                data.recentPayments.map((row) => (
                  <div key={row.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="font-semibold text-slate-900">{row.customerName}</p>
                    <p className="text-xs text-slate-600">#{row.bookingCode} • {money(row.totalAmount)}</p>
                    <p className="text-xs text-slate-600">{formatDateTime(row.paymentReceivedAt)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>{t("widgets.reviewsPendingModeration")}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.pendingReviews.length === 0 ? (
                <p className="text-sm text-slate-500">{t("empty.noPendingReviews")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.customer")}</TableHead>
                      <TableHead>{t("table.booking")}</TableHead>
                      <TableHead>{t("table.rating")}</TableHead>
                      <TableHead>{t("table.created")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.pendingReviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>{review.customerName}</TableCell>
                        <TableCell>{review.bookingCode}</TableCell>
                        <TableCell>{review.rating}/5</TableCell>
                        <TableCell>{formatDateTime(review.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

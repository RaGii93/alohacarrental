"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Activity,
  BarChart3,
  CalendarClock,
  CalendarDays,
  Car,
  ChevronRight,
  Gauge,
  TimerOff,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  isAfter,
  isBefore,
  isSameDay,
  max as maxDate,
  min as minDate,
} from "date-fns";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DateRangeFilters } from "@/components/admin/DateRangeFilters";
import { cn } from "@/lib/utils";

type DemandRow = {
  label: string;
  count: number;
};

type FleetScheduleVehicle = {
  id: string;
  name: string;
  plateNumber: string | null;
  status: "ACTIVE" | "ON_RENT" | "MAINTENANCE" | "INACTIVE";
  categoryName: string;
};

type FleetScheduleBooking = {
  id: string;
  vehicleId: string;
  bookingCode: string;
  customerName: string;
  startDate: string;
  endDate: string;
  pickupLocation: string | null;
  dropoffLocation: string | null;
  displayStatus: "CONFIRMED" | "ACTIVE" | "PENDING" | "COMPLETED";
};

type FleetScheduleBlockout = {
  id: string;
  vehicleId: string | null;
  startDate: string;
  endDate: string;
  note: string | null;
};

type FleetDashboardProps = {
  locale: string;
  initialView: "calendar" | "operations" | "forecast";
  initialStart: string;
  initialEnd: string;
  activeVehicles: number;
  activeVehiclesPrev: number;
  onRentNow: number;
  onRentNowPrev: number;
  utilizationPct: number;
  utilizationPrevPct: number;
  pickupsInRange: number;
  pickupsInRangePrev: number;
  returnsInRange: number;
  returnsInRangePrev: number;
  returnsToday: number;
  returnsTodayPrev: number;
  overdueReturns: number;
  overdueReturnsPrev: number;
  expectedDemandTotal: number;
  expectedDemandPrevTotal: number;
  topDemandLabel: string;
  topDemandCurrentCount: number;
  topDemandPrevCount: number;
  demandByCategory: DemandRow[];
  vehicles: FleetScheduleVehicle[];
  bookings: FleetScheduleBooking[];
  blockouts: FleetScheduleBlockout[];
};

type ScheduleEvent =
  | {
      kind: "booking";
      id: string;
      label: string;
      startDate: Date;
      endDate: Date;
      tone: "CONFIRMED" | "ACTIVE" | "PENDING" | "COMPLETED";
      meta: string;
    }
  | {
      kind: "blockout";
      id: string;
      label: string;
      startDate: Date;
      endDate: Date;
      tone: "MAINTENANCE" | "BLOCKOUT";
      meta: string;
    };

const flatMetricCard =
  "rounded-[1.6rem] border-0 bg-white p-4 shadow-[0_24px_56px_-32px_hsl(215_28%_17%/0.12)] ring-1 ring-[hsl(215_25%_27%/0.05)]";

const dayWidth = 168;
const vehicleColumnWidth = 272;

function trend(current: number, previous: number) {
  const percent =
    previous === 0 ? (current === 0 ? 0 : 100) : ((current - previous) / previous) * 100;
  const rounded = Math.round(percent * 10) / 10;
  return {
    value: rounded,
    isUp: current > previous,
    isDown: current < previous,
  };
}

function trendClass(isUp: boolean, isDown: boolean) {
  if (isUp) return "text-emerald-700 bg-emerald-100";
  if (isDown) return "text-rose-700 bg-rose-100";
  return "text-slate-700 bg-slate-100";
}

function TrendIcon({ isUp, isDown }: { isUp: boolean; isDown: boolean }) {
  if (isUp) return <TrendingUp className="h-3.5 w-3.5" />;
  if (isDown) return <TrendingDown className="h-3.5 w-3.5" />;
  return <BarChart3 className="h-3.5 w-3.5" />;
}

function parseIsoDate(value: string) {
  return new Date(value);
}

function formatRangeLabel(start: Date, end: Date) {
  const sameMonth = format(start, "MMM yyyy") === format(end, "MMM yyyy");
  if (sameMonth) return `${format(start, "d")} - ${format(end, "d MMM yyyy")}`;
  return `${format(start, "d MMM")} - ${format(end, "d MMM yyyy")}`;
}

function eventToneClass(tone: ScheduleEvent["tone"]) {
  switch (tone) {
    case "ACTIVE":
      return "bg-emerald-500 text-white shadow-[0_18px_30px_-20px_rgba(34,197,94,0.8)]";
    case "PENDING":
      return "bg-amber-500 text-white shadow-[0_18px_30px_-20px_rgba(245,158,11,0.8)]";
    case "COMPLETED":
      return "bg-slate-400 text-white shadow-[0_18px_30px_-20px_rgba(100,116,139,0.7)]";
    case "MAINTENANCE":
      return "bg-rose-100 text-rose-800 ring-1 ring-inset ring-rose-200";
    case "BLOCKOUT":
      return "bg-fuchsia-100 text-fuchsia-800 ring-1 ring-inset ring-fuchsia-200";
    default:
      return "bg-blue-600 text-white shadow-[0_18px_30px_-20px_rgba(37,99,235,0.8)]";
  }
}

export function FleetDashboard({
  locale,
  initialView,
  initialStart,
  initialEnd,
  activeVehicles,
  activeVehiclesPrev,
  onRentNow,
  onRentNowPrev,
  utilizationPct,
  utilizationPrevPct,
  pickupsInRange,
  pickupsInRangePrev,
  returnsInRange,
  returnsInRangePrev,
  returnsToday,
  returnsTodayPrev,
  overdueReturns,
  overdueReturnsPrev,
  expectedDemandTotal,
  expectedDemandPrevTotal,
  topDemandLabel,
  topDemandCurrentCount,
  topDemandPrevCount,
  demandByCategory,
  vehicles,
  bookings,
  blockouts,
}: FleetDashboardProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rangeStart = useMemo(() => new Date(`${initialStart}T00:00:00`), [initialStart]);
  const rangeEnd = useMemo(() => new Date(`${initialEnd}T23:59:59`), [initialEnd]);
  const rangeEndExclusive = useMemo(() => addDays(new Date(`${initialEnd}T00:00:00`), 1), [initialEnd]);
  const days = useMemo(
    () => eachDayOfInterval({ start: rangeStart, end: new Date(`${initialEnd}T00:00:00`) }),
    [initialEnd, rangeStart]
  );
  const rangeDayCount = Math.max(1, differenceInCalendarDays(new Date(`${initialEnd}T00:00:00`), rangeStart) + 1);
  const rangeLabel = formatRangeLabel(rangeStart, new Date(`${initialEnd}T00:00:00`));
  const today = new Date();
  const todayVisible = !isBefore(today, rangeStart) && !isAfter(today, rangeEnd);
  const currentDayOffset = todayVisible ? differenceInCalendarDays(today, rangeStart) : -1;
  const timelineWidth = days.length * dayWidth;
  const demandMax = Math.max(...demandByCategory.map((row) => row.count), 1);

  const bookingsByVehicle = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();

    vehicles.forEach((vehicle) => {
      map.set(vehicle.id, []);
    });

    bookings.forEach((booking) => {
      const startDate = parseIsoDate(booking.startDate);
      const endDate = parseIsoDate(booking.endDate);
      const meta = `${format(startDate, "d MMM")} - ${format(endDate, "d MMM")} · ${booking.bookingCode}`;
      const current = map.get(booking.vehicleId) || [];
      current.push({
        kind: "booking",
        id: booking.id,
        label: booking.customerName,
        startDate,
        endDate,
        tone: booking.displayStatus,
        meta,
      });
      map.set(booking.vehicleId, current);
    });

    vehicles.forEach((vehicle) => {
      const current = map.get(vehicle.id) || [];
      const sharedBlockouts = blockouts.filter((blockout) => !blockout.vehicleId || blockout.vehicleId === vehicle.id);

      sharedBlockouts.forEach((blockout) => {
        current.push({
          kind: "blockout",
          id: blockout.id,
          label: blockout.note?.trim() || (blockout.vehicleId ? t("admin.fleet.calendar.vehicleBlockout") : t("admin.fleet.calendar.globalBlockout")),
          startDate: parseIsoDate(blockout.startDate),
          endDate: parseIsoDate(blockout.endDate),
          tone: blockout.note?.toLowerCase().includes("maint") || vehicle.status === "MAINTENANCE" ? "MAINTENANCE" : "BLOCKOUT",
          meta: `${format(parseIsoDate(blockout.startDate), "d MMM")} - ${format(parseIsoDate(blockout.endDate), "d MMM")}`,
        });
      });

      if (vehicle.status === "MAINTENANCE" && !current.some((item) => item.kind === "blockout")) {
        current.push({
          kind: "blockout",
          id: `${vehicle.id}-maintenance`,
          label: t("admin.fleet.calendar.maintenanceBlock"),
          startDate: rangeStart,
          endDate: rangeEndExclusive,
          tone: "MAINTENANCE",
          meta: t("admin.fleet.calendar.unavailableRange"),
        });
      }

      current.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      map.set(vehicle.id, current);
    });

    return map;
  }, [blockouts, bookings, rangeEndExclusive, rangeStart, t, vehicles]);

  const getVehicleStatusLabel = (status: FleetScheduleVehicle["status"]) => {
    switch (status) {
      case "ACTIVE":
        return t("admin.vehicles.active");
      case "ON_RENT":
        return t("admin.vehicles.onRent");
      case "MAINTENANCE":
        return t("admin.vehicles.maintenance");
      case "INACTIVE":
        return t("admin.vehicles.inactive");
    }
  };

  const getBookingStatusLabel = (status: FleetScheduleBooking["displayStatus"]) => {
    switch (status) {
      case "CONFIRMED":
        return t("common.confirmed");
      case "ACTIVE":
        return t("admin.fleet.statuses.active");
      case "PENDING":
        return t("common.pending");
      case "COMPLETED":
        return t("admin.fleet.statuses.completed");
    }
  };

  const operationalMetrics = [
    {
      title: t("admin.fleet.cards.activeFleet"),
      value: activeVehicles,
      prev: activeVehiclesPrev,
      icon: Activity,
      iconWrap: "bg-emerald-100 text-emerald-700",
    },
    {
      title: t("admin.fleet.cards.onRentNow"),
      value: onRentNow,
      prev: onRentNowPrev,
      icon: Car,
      iconWrap: "bg-cyan-100 text-cyan-700",
    },
    {
      title: t("admin.fleet.cards.utilization"),
      value: utilizationPct,
      prev: utilizationPrevPct,
      suffix: "%",
      icon: Gauge,
      iconWrap: "bg-blue-100 text-blue-700",
    },
    {
      title: t("admin.fleet.cards.pickups", { days: rangeDayCount }),
      value: pickupsInRange,
      prev: pickupsInRangePrev,
      icon: CalendarClock,
      iconWrap: "bg-violet-100 text-violet-700",
    },
    {
      title: t("admin.fleet.cards.returns", { days: rangeDayCount }),
      value: returnsInRange,
      prev: returnsInRangePrev,
      icon: CalendarDays,
      iconWrap: "bg-orange-100 text-orange-700",
    },
    {
      title: t("admin.fleet.cards.returnsToday"),
      value: returnsToday,
      prev: returnsTodayPrev,
      icon: ChevronRight,
      iconWrap: "bg-amber-100 text-amber-700",
    },
    {
      title: t("admin.fleet.cards.overdueReturns"),
      value: overdueReturns,
      prev: overdueReturnsPrev,
      icon: TimerOff,
      iconWrap: "bg-rose-100 text-rose-700",
    },
  ];

  const forecastMetrics = [
    {
      title: t("admin.fleet.cards.expectedDemand", { days: rangeDayCount }),
      value: expectedDemandTotal,
      prev: expectedDemandPrevTotal,
      icon: CalendarDays,
      iconWrap: "bg-indigo-100 text-indigo-700",
    },
    {
      title: t("admin.fleet.cards.topDemand"),
      value: topDemandCurrentCount,
      prev: topDemandPrevCount,
      customValue: topDemandLabel,
      icon: BarChart3,
      iconWrap: "bg-fuchsia-100 text-fuchsia-700",
    },
  ];

  const visibleBookings = useMemo(() => {
    return [...bookings]
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 10);
  }, [bookings]);

  const setView = (nextView: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("fleet_view", nextView);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const vehicleHistoryHref = (vehicleId: string) => `/${locale}/admin/maintenance/vehicles/${vehicleId}`;

  return (
    <Tabs value={initialView} onValueChange={setView} className="w-full gap-5">
      <Card className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_28%),linear-gradient(180deg,#ffffff,rgba(248,250,252,0.98))] shadow-[0_35px_90px_-52px_rgba(15,23,42,0.35)]">
        <div className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                {t("admin.fleet.workspace.kicker")}
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">{rangeLabel}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {t("admin.fleet.workspace.comparedWindow", { days: rangeDayCount })}
                </p>
              </div>
            </div>
            <div className="rounded-[1.6rem] border border-slate-200 bg-white/90 p-1.5 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.25)]">
              <TabsList className="h-auto gap-2 bg-transparent p-0">
                <TabsTrigger value="calendar" className="h-auto min-w-[132px] rounded-[1.1rem] px-4 py-3 data-[state=active]:border-slate-200 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                  <div className="text-left">
                    <div className="font-semibold">{t("admin.fleet.tabs.calendar")}</div>
                    <div className="text-xs opacity-70">{t("admin.fleet.tabs.calendarHint")}</div>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="operations" className="h-auto min-w-[132px] rounded-[1.1rem] px-4 py-3 data-[state=active]:border-slate-200 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                  <div className="text-left">
                    <div className="font-semibold">{t("admin.fleet.tabs.operations")}</div>
                    <div className="text-xs opacity-70">{t("admin.fleet.tabs.operationsHint")}</div>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="forecast" className="h-auto min-w-[132px] rounded-[1.1rem] px-4 py-3 data-[state=active]:border-slate-200 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                  <div className="text-left">
                    <div className="font-semibold">{t("admin.fleet.tabs.forecast")}</div>
                    <div className="text-xs opacity-70">{t("admin.fleet.tabs.forecastHint")}</div>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-slate-200 bg-white/90 p-4 shadow-[0_16px_34px_-30px_rgba(15,23,42,0.25)]">
            <DateRangeFilters initialStart={initialStart} initialEnd={initialEnd} />
          </div>
        </div>
      </Card>

      <TabsContent value="calendar" className="space-y-4">
        <Card className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_70px_-48px_rgba(15,23,42,0.35)]">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <h3 className="text-lg font-bold text-slate-900">{t("admin.fleet.calendar.title")}</h3>
            <p className="mt-1 text-sm text-slate-600">
              {t("admin.fleet.calendar.description")}
            </p>
          </div>
          <ScrollArea className="w-full">
            <div style={{ minWidth: vehicleColumnWidth + timelineWidth }}>
              <div className="sticky top-0 z-30 flex border-b border-slate-200 bg-slate-50/95 backdrop-blur">
                <div
                  className="sticky left-0 z-30 flex shrink-0 items-center gap-3 border-r border-slate-200 bg-slate-50/95 px-5 py-4"
                  style={{ width: vehicleColumnWidth }}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{t("admin.fleet.calendar.licensePlate")}</p>
                    <p className="text-sm font-semibold text-slate-900">{t("admin.bookings.table.vehicle")}</p>
                  </div>
                </div>
                <div className="relative flex" style={{ width: timelineWidth }}>
                  {days.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "flex shrink-0 flex-col items-center justify-center border-r border-slate-200 px-2 py-4 text-center",
                        isSameDay(day, today) ? "bg-slate-200/70" : ""
                      )}
                      style={{ width: dayWidth }}
                    >
                      <span className="text-sm font-semibold text-slate-800">{format(day, "EEE")}</span>
                      <span className="text-xs text-slate-500">{format(day, "d MMM")}</span>
                    </div>
                  ))}
                  {todayVisible ? (
                    <div
                      className="pointer-events-none absolute bottom-0 top-0 w-px bg-slate-900/75"
                      style={{ left: currentDayOffset * dayWidth + dayWidth / 2 }}
                    />
                  ) : null}
                </div>
              </div>

              {vehicles.map((vehicle) => {
                const events = bookingsByVehicle.get(vehicle.id) || [];
                const rowHeight = Math.max(86, 24 + events.length * 22);

                return (
                  <div key={vehicle.id} className="flex border-b border-slate-200 last:border-b-0">
                    <div
                      className="sticky left-0 z-20 shrink-0 border-r border-slate-200 bg-white px-5 py-4"
                      style={{ width: vehicleColumnWidth, minHeight: rowHeight }}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link href={vehicleHistoryHref(vehicle.id)} className="font-mono text-xl font-semibold tracking-tight text-slate-900 hover:text-sky-700 hover:underline">
                              {vehicle.plateNumber || t("admin.fleet.calendar.noPlate")}
                            </Link>
                            <p className="mt-1 truncate text-sm text-slate-600">
                              <Link href={vehicleHistoryHref(vehicle.id)} className="hover:text-sky-700 hover:underline">
                                {vehicle.name}
                              </Link>
                            </p>
                              <p className="text-xs text-slate-400">{vehicle.categoryName}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                              vehicle.status === "MAINTENANCE"
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : vehicle.status === "ON_RENT"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : vehicle.status === "INACTIVE"
                                    ? "border-slate-200 bg-slate-100 text-slate-600"
                                    : "border-sky-200 bg-sky-50 text-sky-700"
                            )}
                          >
                            {getVehicleStatusLabel(vehicle.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="relative" style={{ width: timelineWidth, minHeight: rowHeight }}>
                      <div
                        className="grid h-full"
                        style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, ${dayWidth}px))` }}
                      >
                        {days.map((day) => (
                          <div
                            key={`${vehicle.id}-${day.toISOString()}`}
                            className={cn(
                              "border-r border-slate-200",
                              isSameDay(day, today) ? "bg-slate-50" : "bg-white"
                            )}
                          />
                        ))}
                      </div>

                      <div className="pointer-events-none absolute inset-0 p-2.5">
                        {events.map((event, index) => {
                          const clampedStart = maxDate([event.startDate, rangeStart]);
                          const clampedEnd = minDate([event.endDate, rangeEndExclusive]);
                          const startOffset = differenceInCalendarDays(clampedStart, rangeStart);
                          const widthDays = Math.max(
                            1,
                            differenceInCalendarDays(clampedEnd, rangeStart) - startOffset
                          );

                          return (
                            <div
                              key={event.id}
                              className={cn(
                                "absolute flex h-[18px] items-center gap-2 overflow-hidden rounded-xl px-3 py-5 text-sm font-semibold",
                                eventToneClass(event.tone)
                              )}
                              style={{
                                left: startOffset * dayWidth + 4,
                                width: widthDays * dayWidth - 8,
                                top: 10 + index * 22,
                              }}
                            >
                              <span className="truncate">{event.label}</span>
                              <span className="hidden truncate text-xs opacity-90 lg:inline">{event.meta}</span>
                            </div>
                          );
                        })}
                      </div>

                      {todayVisible ? (
                        <div
                          className="pointer-events-none absolute bottom-0 top-0 w-px bg-slate-900/75"
                          style={{ left: currentDayOffset * dayWidth + dayWidth / 2 }}
                        />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <div className="border-t border-slate-200 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap gap-3 text-sm">
                {[
                { label: t("common.confirmed"), tone: "CONFIRMED" as const },
                { label: t("admin.fleet.statuses.active"), tone: "ACTIVE" as const },
                { label: t("common.pending"), tone: "PENDING" as const },
                { label: t("admin.fleet.statuses.completed"), tone: "COMPLETED" as const },
                { label: t("admin.vehicles.maintenance"), tone: "MAINTENANCE" as const },
                { label: t("admin.fleet.statuses.blockout"), tone: "BLOCKOUT" as const },
              ].map((item) => (
                <div key={item.label} className="inline-flex items-center gap-2 text-slate-600">
                  <span className={cn("h-3 w-3 rounded-full", item.tone === "MAINTENANCE" || item.tone === "BLOCKOUT" ? "rounded-sm" : "", eventToneClass(item.tone).split(" ")[0])} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="operations" className="space-y-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {operationalMetrics.map((item) => {
            const itemTrend = trend(item.value, item.prev);
            return (
              <Card key={item.title} className={flatMetricCard}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className={cn("rounded-xl p-2.5", item.iconWrap)}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium",
                      trendClass(itemTrend.isUp, itemTrend.isDown)
                    )}
                  >
                    <TrendIcon isUp={itemTrend.isUp} isDown={itemTrend.isDown} />
                    {itemTrend.value > 0 ? "+" : ""}
                    {itemTrend.value}%
                  </span>
                </div>
                <p className="text-sm text-slate-500">{item.title}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {item.value}
                  {item.suffix || ""}
                </p>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className={flatMetricCard}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Schedule Snapshot</h3>
                <p className="mt-1 text-sm text-slate-500">{t("admin.fleet.operations.snapshotDescription")}</p>
              </div>
              <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 text-slate-700">
                {t("admin.fleet.operations.visibleCount", { count: visibleBookings.length })}
              </Badge>
            </div>

            <div className="mt-4 space-y-3">
              {visibleBookings.length === 0 ? (
                <p className="text-sm text-slate-500">{t("admin.fleet.operations.emptySnapshot")}</p>
              ) : (
                visibleBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{booking.customerName}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {t("admin.fleet.operations.bookingWindow", {
                          start: format(parseIsoDate(booking.startDate), "d MMM, HH:mm"),
                          end: format(parseIsoDate(booking.endDate), "d MMM, HH:mm"),
                        })}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-400">
                        {booking.pickupLocation || "-"} → {booking.dropoffLocation || "-"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full border px-2.5 py-1 font-semibold",
                          booking.displayStatus === "ACTIVE"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : booking.displayStatus === "PENDING"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : booking.displayStatus === "COMPLETED"
                                ? "border-slate-200 bg-slate-100 text-slate-600"
                                : "border-blue-200 bg-blue-50 text-blue-700"
                        )}
                      >
                        {getBookingStatusLabel(booking.displayStatus)}
                      </Badge>
                      <Badge variant="secondary" className="rounded-full bg-white text-slate-600">
                        {booking.bookingCode}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className={flatMetricCard}>
            <h3 className="text-base font-bold text-slate-900">{t("admin.fleet.operations.notesTitle")}</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="font-semibold text-slate-900">{t("admin.fleet.operations.selectedRange")}</p>
                <p className="mt-1">{rangeLabel}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="font-semibold text-slate-900">{t("admin.fleet.operations.todayMarker")}</p>
                <p className="mt-1">
                  {todayVisible ? t("admin.fleet.operations.todayVisible") : t("admin.fleet.operations.todayOutside")}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="font-semibold text-slate-900">{t("admin.fleet.operations.bestPractice")}</p>
                <p className="mt-1">
                  {t("admin.fleet.operations.bestPracticeDescription")}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="forecast" className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {forecastMetrics.map((item) => {
            const itemTrend = trend(item.value, item.prev);
            return (
              <Card key={item.title} className={flatMetricCard}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className={cn("rounded-xl p-2.5", item.iconWrap)}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium",
                      trendClass(itemTrend.isUp, itemTrend.isDown)
                    )}
                  >
                    <TrendIcon isUp={itemTrend.isUp} isDown={itemTrend.isDown} />
                    {itemTrend.value > 0 ? "+" : ""}
                    {itemTrend.value}%
                  </span>
                </div>
                <p className="text-sm text-slate-500">{item.title}</p>
                <p className={cn("mt-1 font-bold text-slate-900", item.customValue ? "text-xl" : "text-2xl")}>
                  {item.customValue ?? item.value}
                </p>
              </Card>
            );
          })}
        </div>

        <Card className={flatMetricCard}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">{t("admin.fleet.forecast.title")}</h3>
              <p className="mt-1 text-sm text-slate-500">{t("admin.fleet.forecast.description")}</p>
            </div>
            <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 text-slate-700">
              {t("admin.fleet.forecast.bookingsCount", { count: expectedDemandTotal })}
            </Badge>
          </div>
          <div className="mt-5 space-y-4">
            {demandByCategory.length === 0 ? (
              <p className="text-sm text-slate-500">{t("admin.fleet.forecast.empty")}</p>
            ) : (
              demandByCategory.map((row) => (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-700">{row.label}</span>
                    <span className="font-semibold text-slate-900">{row.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-indigo-500"
                      style={{ width: `${(row.count / demandMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

import {
  Activity,
  BarChart3,
  CalendarClock,
  CalendarDays,
  CalendarSync,
  Car,
  Gauge,
  Star,
  TimerOff,
  TrendingDown,
  TrendingUp,
  Undo2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type DemandRow = {
  label: string;
  count: number;
};

type FleetDashboardProps = {
  activeVehicles: number;
  activeVehiclesPrev: number;
  onRentNow: number;
  onRentNowPrev: number;
  utilizationPct: number;
  utilizationPrevPct: number;
  pickups7d: number;
  pickups7dPrev: number;
  returns7d: number;
  returns7dPrev: number;
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
};

function trend(current: number, previous: number) {
  const percent =
    previous === 0
      ? current === 0
        ? 0
        : 100
      : ((current - previous) / previous) * 100;
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

const flatMetricCard = "rounded-[1.6rem] border-0 bg-white p-4 shadow-[0_24px_56px_-32px_hsl(215_28%_17%/0.12)] ring-1 ring-[hsl(215_25%_27%/0.05)]";

export function FleetDashboard({
  activeVehicles,
  activeVehiclesPrev,
  onRentNow,
  onRentNowPrev,
  utilizationPct,
  utilizationPrevPct,
  pickups7d,
  pickups7dPrev,
  returns7d,
  returns7dPrev,
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
}: FleetDashboardProps) {
  const weeklyMax = Math.max(pickups7d, returns7d, pickups7dPrev, returns7dPrev, 1);
  const demandMax = Math.max(...demandByCategory.map((row) => row.count), 1);

  const operationalMetrics = [
    {
      title: "Active Fleet",
      value: activeVehicles,
      prev: activeVehiclesPrev,
      icon: Activity,
      iconWrap: "bg-emerald-100 text-emerald-700",
    },
    {
      title: "On Rent Now",
      value: onRentNow,
      prev: onRentNowPrev,
      icon: Car,
      iconWrap: "bg-cyan-100 text-cyan-700",
    },
    {
      title: "Fleet Utilization",
      value: utilizationPct,
      prev: utilizationPrevPct,
      suffix: "%",
      icon: Gauge,
      iconWrap: "bg-blue-100 text-blue-700",
    },
    {
      title: "Upcoming Pickups (7d)",
      value: pickups7d,
      prev: pickups7dPrev,
      icon: CalendarClock,
      iconWrap: "bg-violet-100 text-violet-700",
    },
    {
      title: "Upcoming Returns (7d)",
      value: returns7d,
      prev: returns7dPrev,
      icon: CalendarSync,
      iconWrap: "bg-orange-100 text-orange-700",
    },
    {
      title: "Returns Due Today",
      value: returnsToday,
      prev: returnsTodayPrev,
      icon: Undo2,
      iconWrap: "bg-amber-100 text-amber-700",
    },
    {
      title: "Overdue Returns",
      value: overdueReturns,
      prev: overdueReturnsPrev,
      icon: TimerOff,
      iconWrap: "bg-rose-100 text-rose-700",
    },
  ];

  const forecastMetrics = [
    {
      title: "Expected Demand (7d)",
      value: expectedDemandTotal,
      prev: expectedDemandPrevTotal,
      icon: CalendarDays,
      iconWrap: "bg-indigo-100 text-indigo-700",
    },
    {
      title: "Top Demand Category",
      value: topDemandCurrentCount,
      prev: topDemandPrevCount,
      customValue: topDemandLabel,
      icon: Star,
      iconWrap: "bg-fuchsia-100 text-fuchsia-700",
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Compared with the previous 7 days</p>

      <Tabs defaultValue="forecast" className="w-full">
        <TabsList className="flex h-auto">
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {forecastMetrics.map((item) => {
              const itemTrend = trend(item.value, item.prev);
              return (
                <Card key={item.title} className={flatMetricCard}>
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className={`rounded-md p-2 ${item.iconWrap}`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${trendClass(itemTrend.isUp, itemTrend.isDown)}`}>
                      <TrendIcon isUp={itemTrend.isUp} isDown={itemTrend.isDown} />
                      {itemTrend.value > 0 ? "+" : ""}
                      {itemTrend.value}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.title}</p>
                  <p className={`${item.customValue ? "text-xl" : "text-2xl"} font-bold break-words`}>
                    {item.customValue ?? item.value}
                  </p>
                </Card>
              );
            })}
          </div>

          <Card className={flatMetricCard}>
            <p className="mb-3 font-semibold">Weekly Flow (Current vs Previous)</p>
            <div className="space-y-3">
              {[
                { label: "Pickups", current: pickups7d, previous: pickups7dPrev, color: "bg-violet-500" },
                { label: "Returns", current: returns7d, previous: returns7dPrev, color: "bg-orange-500" },
              ].map((row) => (
                <div key={row.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{row.label}</span>
                    <span className="text-muted-foreground">Current {row.current} · Previous {row.previous}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className={`h-2 rounded-full ${row.color}`} style={{ width: `${(row.current / weeklyMax) * 100}%` }} />
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-slate-300" style={{ width: `${(row.previous / weeklyMax) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className={flatMetricCard}>
            <p className="mb-3 font-semibold">Expected Demand by Category (Next 7 Days)</p>
            <div className="space-y-3">
              {demandByCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No expected demand.</p>
              ) : (
                demandByCategory.map((row) => (
                  <div key={row.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{row.label}</span>
                      <span className="font-medium">{row.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${(row.count / demandMax) * 100}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="mt-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {operationalMetrics.map((item) => {
              const itemTrend = trend(item.value, item.prev);
              return (
                <Card key={item.title} className={flatMetricCard}>
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className={`rounded-md p-2 ${item.iconWrap}`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${trendClass(itemTrend.isUp, itemTrend.isDown)}`}>
                      <TrendIcon isUp={itemTrend.isUp} isDown={itemTrend.isDown} />
                      {itemTrend.value > 0 ? "+" : ""}
                      {itemTrend.value}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.title}</p>
                  <p className="text-2xl font-bold">
                    {item.value}
                    {item.suffix || ""}
                  </p>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

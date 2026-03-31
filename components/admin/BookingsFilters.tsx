"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarDays, Filter, Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";

type BookingsFiltersProps = {
  initialStart: string;
  initialEnd: string;
  initialQuery: string;
};

const parseInputDate = (value: string): Date | null => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toInputDate = (value: Date): string => {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export function BookingsFilters({
  initialStart,
  initialEnd,
  initialQuery,
}: BookingsFiltersProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialStartDate = useMemo(() => parseInputDate(initialStart), [initialStart]);
  const initialEndDate = useMemo(() => parseInputDate(initialEnd), [initialEnd]);

  const [startDate, setStartDate] = useState<Date | null>(initialStartDate);
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate);
  const [query, setQuery] = useState(initialQuery);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (startDate) params.set("start", toInputDate(startDate));
    else params.delete("start");
    if (endDate) params.set("end", toInputDate(endDate));
    else params.delete("end");
    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");
    params.delete("pending_page");
    params.delete("confirmed_page");
    params.delete("declined_page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const resetFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("start");
    params.delete("end");
    params.delete("q");
    params.delete("pending_page");
    params.delete("confirmed_page");
    params.delete("declined_page");
    setStartDate(null);
    setEndDate(null);
    setQuery("");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Card className="admin-surface rounded-[1.8rem] border-transparent p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">{t("admin.bookings.filters.kicker")}</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{t("admin.bookings.filters.title")}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            {t("admin.bookings.filters.description")}
          </p>
        </div>
        <div className="flex gap-2 self-start">
          <Button type="button" variant="outline" className="admin-outline-button rounded-xl border-transparent" onClick={applyFilters}>
            <Filter className="size-4" />
            {t("admin.fleetOps.apply")}
          </Button>
          <Button type="button" variant="ghost" className="rounded-xl text-slate-600 hover:bg-slate-100/90 hover:text-slate-900" onClick={resetFilters}>
            <RotateCcw className="size-4" />
            {t("admin.fleetOps.reset")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_220px_220px]">
        <div>
          <label htmlFor="bookings-search" className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Search className="size-3.5" />
            {t("admin.fleetOps.search")}
          </label>
          <Input
            id="bookings-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("admin.bookings.filters.searchPlaceholder")}
            className="rounded-xl"
          />
        </div>
        <div>
          <label htmlFor="bookings-start" className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <CalendarDays className="size-3.5" />
            {t("admin.fleetOps.startDate")}
          </label>
          <DatePicker
            id="bookings-start"
            value={startDate}
            onChange={setStartDate}
            placeholder={t("admin.fleetOps.startPlaceholder")}
            fromYear={2000}
            toYear={2100}
          />
        </div>
        <div>
          <label htmlFor="bookings-end" className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <CalendarDays className="size-3.5" />
            {t("admin.fleetOps.endDate")}
          </label>
          <DatePicker
            id="bookings-end"
            value={endDate}
            onChange={setEndDate}
            placeholder={t("admin.fleetOps.endPlaceholder")}
            fromYear={2000}
            toYear={2100}
          />
        </div>
      </div>
    </Card>
  );
}

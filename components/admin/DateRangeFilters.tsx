"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarDays, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";

type DateRangeFiltersProps = {
  initialStart: string;
  initialEnd: string;
  startParam?: string;
  endParam?: string;
  pageParam?: string;
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

export function DateRangeFilters({
  initialStart,
  initialEnd,
  startParam = "start",
  endParam = "end",
  pageParam,
}: DateRangeFiltersProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialStartDate = useMemo(() => parseInputDate(initialStart), [initialStart]);
  const initialEndDate = useMemo(() => parseInputDate(initialEnd), [initialEnd]);

  const [startDate, setStartDate] = useState<Date | null>(initialStartDate);
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (startDate) params.set(startParam, toInputDate(startDate));
    else params.delete(startParam);
    if (endDate) params.set(endParam, toInputDate(endDate));
    else params.delete(endParam);
    if (pageParam) params.set(pageParam, "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const resetFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(startParam);
    params.delete(endParam);
    if (pageParam) params.delete(pageParam);
    setStartDate(null);
    setEndDate(null);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-full sm:w-[220px]">
        <label htmlFor={`${startParam}-date`} className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          {t("admin.filters.startDate")}
        </label>
        <DatePicker
          id={`${startParam}-date`}
          value={startDate}
          onChange={setStartDate}
          placeholder={t("admin.filters.selectStartDate")}
          fromYear={2000}
          toYear={2100}
        />
      </div>
      <div className="w-full sm:w-[220px]">
        <label htmlFor={`${endParam}-date`} className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          {t("admin.filters.endDate")}
        </label>
        <DatePicker
          id={`${endParam}-date`}
          value={endDate}
          onChange={setEndDate}
          placeholder={t("admin.filters.selectEndDate")}
          fromYear={2000}
          toYear={2100}
        />
      </div>
      <div className="flex items-end gap-2">
        <Button type="button" variant="outline" className="h-9" onClick={applyFilters}>
          <Filter className="h-4 w-4" />
          {t("admin.filters.apply")}
        </Button>
        <Button type="button" variant="ghost" className="h-9" onClick={resetFilters}>
          <RotateCcw className="h-4 w-4" />
          {t("admin.filters.reset")}
        </Button>
      </div>
    </div>
  );
}

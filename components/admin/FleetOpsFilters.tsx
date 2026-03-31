"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarDays, Filter, RotateCcw, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FilterOption = {
  value: string;
  label: string;
};

type FilterSelect = {
  param: string;
  label: string;
  placeholder: string;
  allLabel?: string;
  options: FilterOption[];
};

type FleetOpsFiltersProps = {
  title: string;
  description: string;
  audiences?: string[];
  resultSummary?: string;
  search?: {
    param?: string;
    initialValue?: string;
    placeholder: string;
  };
  selects?: FilterSelect[];
  dateRange?: {
    startParam?: string;
    endParam?: string;
    initialStart?: string;
    initialEnd?: string;
  };
};

const parseInputDate = (value?: string): Date | null => {
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

export function FleetOpsFilters({
  title,
  description,
  audiences = ["Financial clerk", "Mechanic", "Administration", "Rental agent"],
  resultSummary,
  search,
  selects = [],
  dateRange,
}: FleetOpsFiltersProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchParam = search?.param ?? "q";
  const startParam = dateRange?.startParam ?? "start";
  const endParam = dateRange?.endParam ?? "end";

  const [searchValue, setSearchValue] = useState(search?.initialValue ?? "");
  const [startDate, setStartDate] = useState<Date | null>(parseInputDate(dateRange?.initialStart));
  const [endDate, setEndDate] = useState<Date | null>(parseInputDate(dateRange?.initialEnd));
  const [selectValues, setSelectValues] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        selects.map((select) => [select.param, searchParams.get(select.param) || "all"])
      )
  );

  const hasActiveFilters = useMemo(() => {
    if ((searchValue || "").trim()) return true;
    if (startDate || endDate) return true;
    return selects.some((select) => (selectValues[select.param] || "all") !== "all");
  }, [endDate, searchValue, selects, selectValues, startDate]);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (search) {
      const normalizedSearch = searchValue.trim();
      if (normalizedSearch) params.set(searchParam, normalizedSearch);
      else params.delete(searchParam);
    }

    selects.forEach((select) => {
      const value = selectValues[select.param] || "all";
      if (value === "all") params.delete(select.param);
      else params.set(select.param, value);
    });

    if (dateRange) {
      if (startDate) params.set(startParam, toInputDate(startDate));
      else params.delete(startParam);

      if (endDate) params.set(endParam, toInputDate(endDate));
      else params.delete(endParam);
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const resetFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (search) params.delete(searchParam);
    selects.forEach((select) => params.delete(select.param));

    if (dateRange) {
      params.delete(startParam);
      params.delete(endParam);
    }

    setSearchValue("");
    setStartDate(null);
    setEndDate(null);
    setSelectValues(Object.fromEntries(selects.map((select) => [select.param, "all"])));

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Card className="rounded-[1.8rem] border-slate-200 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">{t("admin.fleetOps.filtersTitle")}</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{title}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
              <Users className="size-3.5" />
              {t("admin.fleetOps.builtFor")} {audiences.join(", ")}
            </span>
            {resultSummary ? (
              <span className="rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-700">{resultSummary}</span>
            ) : null}
          </div>
        </div>

        <div className="flex gap-2 self-start">
          <Button type="button" variant="outline" className="rounded-xl" onClick={applyFilters}>
            <Filter className="size-4" />
            {t("admin.filters.apply")}
          </Button>
          <Button type="button" variant="ghost" className="rounded-xl" onClick={resetFilters} disabled={!hasActiveFilters}>
            <RotateCcw className="size-4" />
            {t("admin.filters.reset")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {search ? (
          <div className="xl:col-span-2">
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Search className="size-3.5" />
              {t("admin.fleetOps.search")}
            </label>
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={search.placeholder}
              className="rounded-xl"
            />
          </div>
        ) : null}

        {selects.map((select) => (
          <div key={select.param}>
            <label className="mb-1 block text-xs font-medium text-slate-500">{select.label}</label>
            <Select
              value={selectValues[select.param] || "all"}
              onValueChange={(value) => setSelectValues((current) => ({ ...current, [select.param]: value }))}
            >
              <SelectTrigger className="w-full rounded-xl">
                <SelectValue placeholder={select.placeholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{select.allLabel || select.label}</SelectItem>
                {select.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        {dateRange ? (
          <>
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <CalendarDays className="size-3.5" />
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

            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <CalendarDays className="size-3.5" />
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
          </>
        ) : null}
      </div>
    </Card>
  );
}

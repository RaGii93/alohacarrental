"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { CalendarDays, Filter, RotateCcw } from "lucide-react";

type FinancialFiltersProps = {
  initialStart: string;
  initialEnd: string;
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

export function FinancialFilters({ initialStart, initialEnd }: FinancialFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialStartDate = useMemo(() => parseInputDate(initialStart), [initialStart]);
  const initialEndDate = useMemo(() => parseInputDate(initialEnd), [initialEnd]);

  const [startDate, setStartDate] = useState<Date | null>(initialStartDate);
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "financial");
    if (startDate) params.set("start", toInputDate(startDate));
    else params.delete("start");
    if (endDate) params.set("end", toInputDate(endDate));
    else params.delete("end");
    router.push(`${pathname}?${params.toString()}`);
  };

  const resetFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "financial");
    params.delete("start");
    params.delete("end");
    setStartDate(null);
    setEndDate(null);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="mb-4 flex flex-wrap items-end justify-end gap-3">
      <div className="w-full sm:w-[220px]">
        <label htmlFor="financial-start" className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          Start Date
        </label>
        <DatePicker
          id="financial-start"
          value={startDate}
          onChange={setStartDate}
          placeholder="Select start date"
          fromYear={2000}
          toYear={2100}
        />
      </div>
      <div className="w-full sm:w-[220px]">
        <label htmlFor="financial-end" className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          End Date
        </label>
        <DatePicker
          id="financial-end"
          value={endDate}
          onChange={setEndDate}
          placeholder="Select end date"
          fromYear={2000}
          toYear={2100}
        />
      </div>
      <div className="flex items-end gap-2">
        <Button type="button" variant="outline" className="h-9" onClick={applyFilters}>
          <Filter className="h-4 w-4" />
          Apply Filter
        </Button>
        <Button type="button" variant="ghost" className="h-9" onClick={resetFilters}>
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>
    </div>
  );
}

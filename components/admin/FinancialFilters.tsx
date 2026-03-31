"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarDays, Filter, ReceiptText, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FinancialFiltersProps = {
  initialStart: string;
  initialEnd: string;
  initialQuery: string;
  initialBookingStatus: string;
  initialBillingState: string;
  initialTransferState: string;
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

export function FinancialFilters({
  initialStart,
  initialEnd,
  initialQuery,
  initialBookingStatus,
  initialBillingState,
  initialTransferState,
}: FinancialFiltersProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialStartDate = useMemo(() => parseInputDate(initialStart), [initialStart]);
  const initialEndDate = useMemo(() => parseInputDate(initialEnd), [initialEnd]);

  const [startDate, setStartDate] = useState<Date | null>(initialStartDate);
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate);
  const [query, setQuery] = useState(initialQuery);
  const [bookingStatus, setBookingStatus] = useState(initialBookingStatus || "all");
  const [billingState, setBillingState] = useState(initialBillingState || "all");
  const [transferState, setTransferState] = useState(initialTransferState || "all");

  const hasActiveFilters = Boolean(
    query.trim() ||
    bookingStatus !== "all" ||
    billingState !== "all" ||
    transferState !== "all" ||
    startDate ||
    endDate
  );

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (startDate) params.set("start", toInputDate(startDate));
    else params.delete("start");

    if (endDate) params.set("end", toInputDate(endDate));
    else params.delete("end");

    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");

    if (bookingStatus !== "all") params.set("booking_status", bookingStatus);
    else params.delete("booking_status");

    if (billingState !== "all") params.set("billing_state", billingState);
    else params.delete("billing_state");

    if (transferState !== "all") params.set("transfer_state", transferState);
    else params.delete("transfer_state");

    router.push(`${pathname}?${params.toString()}`);
  };

  const resetFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("start");
    params.delete("end");
    params.delete("q");
    params.delete("booking_status");
    params.delete("billing_state");
    params.delete("transfer_state");

    setStartDate(null);
    setEndDate(null);
    setQuery("");
    setBookingStatus("all");
    setBillingState("all");
    setTransferState("all");

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Card className="admin-surface rounded-[1.8rem] border-transparent p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">{t("admin.financial.filters.kicker")}</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{t("admin.financial.filters.title")}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            {t("admin.financial.filters.description")}
          </p>
        </div>

        <div className="flex gap-2 self-start">
          <Button type="button" variant="outline" className="admin-outline-button rounded-xl border-transparent" onClick={applyFilters}>
            <Filter className="size-4" />
            {t("admin.fleetOps.apply")}
          </Button>
          <Button type="button" variant="ghost" className="rounded-xl text-slate-600 hover:bg-slate-100/90 hover:text-slate-900" onClick={resetFilters} disabled={!hasActiveFilters}>
            <RotateCcw className="size-4" />
            {t("admin.fleetOps.reset")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <label htmlFor="financial-search" className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Search className="size-3.5" />
            {t("admin.fleetOps.search")}
          </label>
          <Input
            id="financial-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("admin.financial.filters.searchPlaceholder")}
            className="rounded-xl"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">{t("admin.financial.filters.bookingState")}</label>
          <Select value={bookingStatus} onValueChange={setBookingStatus}>
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue placeholder={t("admin.financial.filters.allBookings")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.financial.filters.allBookings")}</SelectItem>
              <SelectItem value="CONFIRMED">{t("common.confirmed")}</SelectItem>
              <SelectItem value="PENDING">{t("common.pending")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">{t("admin.financial.filters.billingState")}</label>
          <Select value={billingState} onValueChange={setBillingState}>
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue placeholder={t("admin.financial.filters.allBillingStates")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.financial.filters.allBillingStates")}</SelectItem>
              <SelectItem value="INVOICED">{t("admin.financial.filters.invoiced")}</SelectItem>
              <SelectItem value="UNINVOICED">{t("admin.financial.filters.uninvoiced")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <ReceiptText className="size-3.5" />
            {t("admin.financial.filters.transferState")}
          </label>
          <Select value={transferState} onValueChange={setTransferState}>
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue placeholder={t("admin.financial.filters.allTransfers")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.financial.filters.allTransfers")}</SelectItem>
              <SelectItem value="PENDING">{t("admin.financial.filters.pendingTransfer")}</SelectItem>
              <SelectItem value="TRANSFERRED">{t("admin.financial.filters.transferred")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="financial-start" className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <CalendarDays className="size-3.5" />
            {t("admin.fleetOps.startDate")}
          </label>
          <DatePicker
            id="financial-start"
            value={startDate}
            onChange={setStartDate}
            placeholder={t("admin.fleetOps.startPlaceholder")}
            fromYear={2000}
            toYear={2100}
          />
        </div>

        <div>
          <label htmlFor="financial-end" className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <CalendarDays className="size-3.5" />
            {t("admin.fleetOps.endDate")}
          </label>
          <DatePicker
            id="financial-end"
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

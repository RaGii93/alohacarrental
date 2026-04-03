"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/datetime";
import { createVehicleBlockoutAction, deleteVehicleBlockoutAction, updateVehicleBlockoutAction } from "@/actions/blockouts";
import { CompactText } from "@/components/shared/CompactText";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { formatDateTimeLocalInput } from "@/lib/datetime";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CalendarClockIcon, Clock3Icon, FilterIcon, PlusIcon, SearchIcon } from "lucide-react";

export function BlockoutsClient({
  locale,
  vehicles,
  rows,
}: {
  locale: string;
  vehicles: Array<{ id: string; name: string; plateNumber: string | null }>;
  rows: Array<{
    id: string;
    vehicleId: string | null;
    vehicleName: string | null;
    plateNumber: string | null;
    startDate: Date;
    endDate: Date;
    note: string | null;
    createdAt: Date;
  }>;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"ALL" | "GLOBAL" | "VEHICLE">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "UPCOMING" | "EXPIRED">("ALL");

  const now = new Date();

  const resetForm = () => {
    setEditingId(null);
    setIsModalOpen(false);
    setVehicleId("");
    setStartDate("");
    setEndDate("");
    setNote("");
  };

  const createBlockout = async (formData: FormData) => {
    setIsSaving(true);
    const result = editingId
      ? await updateVehicleBlockoutAction(formData, locale)
      : await createVehicleBlockoutAction(formData, locale);
    setIsSaving(false);
    if (!result.success) {
      toast.error(
        result.error ||
          (editingId ? t("admin.blockouts.messages.updateFailed") : t("admin.blockouts.messages.createFailed"))
      );
      return;
    }
    toast.success(editingId ? t("admin.blockouts.messages.updated") : t("admin.blockouts.messages.created"));
    resetForm();
    router.refresh();
  };

  const deleteBlockout = async (blockoutId: string) => {
    setIsDeletingId(blockoutId);
    const result = await deleteVehicleBlockoutAction(blockoutId, locale);
    setIsDeletingId(null);
    setPendingDeleteId(null);
    if (!result.success) {
      toast.error(result.error || t("admin.blockouts.messages.deleteFailed"));
      return;
    }
    toast.success(t("admin.blockouts.messages.deleted"));
    router.refresh();
  };

  const startEditing = (row: (typeof rows)[number]) => {
    setEditingId(row.id);
    setIsModalOpen(true);
    setVehicleId(row.vehicleId || "");
    setStartDate(formatDateTimeLocalInput(row.startDate));
    setEndDate(formatDateTimeLocalInput(row.endDate));
    setNote(row.note || "");
  };

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (scopeFilter === "GLOBAL" && row.vehicleId) return false;
      if (scopeFilter === "VEHICLE" && !row.vehicleId) return false;
      const rowStatus = row.startDate <= now && row.endDate > now
        ? "ACTIVE"
        : row.startDate > now
          ? "UPCOMING"
          : "EXPIRED";
      if (statusFilter !== "ALL" && rowStatus !== statusFilter) return false;
      if (!query) return true;

      const haystack = [row.vehicleName || "", row.plateNumber || "", row.note || "", row.vehicleId ? "vehicle" : "global"]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [now, rows, scopeFilter, search, statusFilter]);

  const summary = useMemo(() => {
    const active = rows.filter((row) => row.startDate <= now && row.endDate > now).length;
    const upcoming = rows.filter((row) => row.startDate > now).length;
    const expired = rows.filter((row) => row.endDate <= now).length;
    const global = rows.filter((row) => !row.vehicleId).length;
    return {
      total: rows.length,
      active,
      upcoming,
      expired,
      global,
      vehicleSpecific: rows.length - global,
    };
  }, [now, rows]);

  const showingStart = filteredRows.length ? 1 : 0;
  const showingEnd = filteredRows.length;

  const statusMeta = {
    ACTIVE: {
      label: t("admin.blockouts.status.active"),
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    },
    UPCOMING: {
      label: t("admin.blockouts.status.upcoming"),
      className: "bg-amber-50 text-amber-700 ring-amber-200",
    },
    EXPIRED: {
      label: t("admin.blockouts.status.expired"),
      className: "bg-slate-100 text-slate-600 ring-slate-200",
    },
  } as const;

  const statCards = [
    { key: "active", label: t("admin.blockouts.stats.active"), value: summary.active, tone: "bg-emerald-50 text-emerald-700" },
    { key: "upcoming", label: t("admin.blockouts.stats.upcoming"), value: summary.upcoming, tone: "bg-amber-50 text-amber-700" },
    { key: "expired", label: t("admin.blockouts.stats.expired"), value: summary.expired, tone: "bg-slate-100 text-slate-700" },
    { key: "global", label: t("admin.blockouts.stats.global"), value: summary.global, tone: "bg-violet-50 text-violet-700" },
  ];

  return (
    <div className="space-y-8">
      <ConfirmActionDialog
        open={Boolean(pendingDeleteId)}
        onOpenChange={(open) => {
          if (!open && !isDeletingId) setPendingDeleteId(null);
        }}
        title={t("admin.blockouts.deleteConfirmTitle")}
        description={t("admin.blockouts.deleteConfirmDescription")}
        confirmLabel={t("common.delete")}
        destructive
        loading={Boolean(isDeletingId)}
        onConfirm={() => pendingDeleteId ? deleteBlockout(pendingDeleteId) : undefined}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.key} className="admin-surface-soft rounded-[1.7rem] border-transparent p-5">
            <div className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${card.tone}`}>
              {card.label}
            </div>
            <div className="mt-4 text-3xl font-black text-slate-900">{card.value}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 rounded-[1.6rem] bg-white p-5 shadow-[0_24px_56px_-32px_hsl(215_28%_17%/0.12)] ring-1 ring-[hsl(215_25%_27%/0.05)] lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_220px_220px] lg:flex-1">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("common.search")}</label>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("admin.blockouts.filters.searchPlaceholder")}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <FilterIcon className="h-4 w-4 text-slate-500" />
              {t("admin.blockouts.filters.scopeLabel")}
            </label>
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value as "ALL" | "GLOBAL" | "VEHICLE")}
              className="h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="ALL">{t("admin.blockouts.filters.all")}</option>
              <option value="GLOBAL">{t("admin.blockouts.filters.global")}</option>
              <option value="VEHICLE">{t("admin.blockouts.filters.vehicleSpecific")}</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Clock3Icon className="h-4 w-4 text-slate-500" />
              {t("admin.blockouts.filters.statusLabel")}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "UPCOMING" | "EXPIRED")}
              className="h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="ALL">{t("admin.blockouts.filters.allStatuses")}</option>
              <option value="ACTIVE">{t("admin.blockouts.status.active")}</option>
              <option value="UPCOMING">{t("admin.blockouts.status.upcoming")}</option>
              <option value="EXPIRED">{t("admin.blockouts.status.expired")}</option>
            </select>
          </div>
        </div>

        <Dialog
          open={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button
              type="button"
              className="rounded-full"
              onClick={() => {
                setEditingId(null);
                setVehicleId("");
                setStartDate("");
                setEndDate("");
                setNote("");
                setIsModalOpen(true);
              }}
            >
              <PlusIcon className="h-4 w-4" />
              {t("admin.blockouts.actions.new")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? t("admin.blockouts.actions.editTitle") : t("admin.blockouts.actions.newTitle")}
              </DialogTitle>
              <DialogDescription>{t("admin.blockouts.description")}</DialogDescription>
            </DialogHeader>
            <form action={createBlockout} className="grid gap-4 md:grid-cols-2">
              {editingId ? <input type="hidden" name="blockoutId" value={editingId} /> : null}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">{t("admin.blockouts.form.vehicleScope")}</label>
                <select
                  name="vehicleId"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="h-10 w-full rounded-md border px-3 text-sm"
                >
                  <option value="">{t("admin.blockouts.form.allVehicles")}</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.name}{vehicle.plateNumber ? ` (${vehicle.plateNumber})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("admin.blockouts.form.start")}</label>
                <input
                  name="startDate"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 w-full rounded-md border px-3 text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("admin.blockouts.form.end")}</label>
                <input
                  name="endDate"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 w-full rounded-md border px-3 text-sm"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">{t("admin.blockouts.form.reason")}</label>
                <input
                  name="note"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-10 w-full rounded-md border px-3 text-sm"
                  placeholder={t("admin.blockouts.form.optionalNote")}
                />
              </div>
              <DialogFooter className="md:col-span-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving
                    ? t("admin.blockouts.form.saving")
                    : editingId
                      ? t("admin.blockouts.form.update")
                      : t("admin.blockouts.form.create")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="admin-surface rounded-[1.6rem] border-transparent p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-slate-500">
            {t("admin.shared.showing", { start: showingStart, end: showingEnd, total: filteredRows.length })}
          </div>
          <div className="flex flex-wrap gap-2">
            {(["ALL", "ACTIVE", "UPCOMING", "EXPIRED"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                  statusFilter === value
                    ? "bg-[hsl(var(--primary))] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {value === "ALL" ? t("admin.blockouts.filters.allStatuses") : statusMeta[value].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.6rem] bg-white shadow-[0_24px_56px_-32px_hsl(215_28%_17%/0.12)] ring-1 ring-[hsl(215_25%_27%/0.05)]">
        <Table className="bg-transparent">
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.blockouts.table.scope")}</TableHead>
              <TableHead>{t("admin.vehicles.table.plate")}</TableHead>
              <TableHead>{t("admin.blockouts.table.status")}</TableHead>
              <TableHead>{t("admin.blockouts.table.start")}</TableHead>
              <TableHead>{t("admin.blockouts.table.end")}</TableHead>
              <TableHead>{t("admin.blockouts.table.reason")}</TableHead>
              <TableHead>{t("admin.blockouts.table.created")}</TableHead>
              <TableHead>{t("admin.blockouts.table.action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length ? filteredRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-slate-900">{row.vehicleName || t("admin.blockouts.form.allVehicles")}</div>
                    <div className="text-xs text-slate-500">
                      {row.vehicleId ? t("admin.blockouts.filters.vehicleSpecific") : t("admin.blockouts.filters.global")}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{row.plateNumber || "-"}</TableCell>
                <TableCell>
                  {(() => {
                    const status = row.startDate <= now && row.endDate > now
                      ? "ACTIVE"
                      : row.startDate > now
                        ? "UPCOMING"
                        : "EXPIRED";
                    return (
                      <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ring-1 ${statusMeta[status].className}`}>
                        {statusMeta[status].label}
                      </span>
                    );
                  })()}
                </TableCell>
                <TableCell>{formatDateTime(row.startDate)}</TableCell>
                <TableCell>{formatDateTime(row.endDate)}</TableCell>
                <TableCell>
                  <CompactText text={row.note} expandedTitle={t("admin.blockouts.table.fullReason")} />
                </TableCell>
                <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => startEditing(row)}
                  >
                    {t("common.edit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPendingDeleteId(row.id)}
                    disabled={isDeletingId === row.id}
                  >
                    {isDeletingId === row.id ? t("admin.blockouts.table.deleting") : t("common.delete")}
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-slate-500">
                  {t("admin.blockouts.filters.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

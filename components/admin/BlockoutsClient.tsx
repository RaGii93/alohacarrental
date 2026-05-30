"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, CalendarRange, Clock3, Globe2, Plus, Search, SquarePen } from "lucide-react";
import { toast } from "sonner";
import { createVehicleBlockoutAction, deleteVehicleBlockoutAction, updateVehicleBlockoutAction } from "@/actions/blockouts";
import { CompactText } from "@/components/shared/CompactText";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/datetime";
import { formatDateTimeInputInLaPaz, LA_PAZ_TIME_ZONE, parseLaPazDateTimeInput } from "@/lib/timezone";

type BlockoutRow = {
  id: string;
  vehicleId: string | null;
  vehicleName: string | null;
  vehiclePlateNumber: string | null;
  startDate: Date;
  endDate: Date;
  note: string | null;
  createdAt: Date;
};

type TimelineFilter = "all" | "active" | "upcoming" | "past";
type ScopeFilter = "all" | "global" | "vehicle";

function getTimelineStatus(row: BlockoutRow, now: Date): TimelineFilter {
  if (row.endDate <= now) return "past";
  if (row.startDate <= now && row.endDate > now) return "active";
  return "upcoming";
}

function formatDuration(start: Date | null, end: Date | null) {
  if (!start || !end || end <= start) return null;

  const totalMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
  return parts.join(" ");
}

function getTimelineBadgeClasses(status: TimelineFilter) {
  if (status === "active") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "upcoming") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-600";
}

function formatVehicleLabel(vehicle: { name: string; plateNumber?: string | null } | null | undefined) {
  if (!vehicle) return "";
  return vehicle.plateNumber ? `${vehicle.name} (${vehicle.plateNumber})` : vehicle.name;
}

export function BlockoutsClient({
  locale,
  vehicles,
  rows,
}: {
  locale: string;
  vehicles: Array<{ id: string; name: string; plateNumber: string | null }>;
  rows: BlockoutRow[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const now = new Date();

  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("all");
  const [vehicleFilterId, setVehicleFilterId] = useState("all");
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);

  const parsedStart = parseLaPazDateTimeInput(startDate);
  const parsedEnd = parseLaPazDateTimeInput(endDate);
  const hasInvalidRange = Boolean(parsedStart && parsedEnd && parsedEnd <= parsedStart);
  const durationLabel = formatDuration(parsedStart, parsedEnd);

  const filteredRows = rows.filter((row) => {
    const rowStatus = getTimelineStatus(row, now);
    const matchesTimeline = timelineFilter === "all" || rowStatus === timelineFilter;
    const matchesScope =
      scopeFilter === "all" ||
      (scopeFilter === "global" ? !row.vehicleId : Boolean(row.vehicleId));
    const matchesVehicle = vehicleFilterId === "all" || row.vehicleId === vehicleFilterId;
    const query = searchQuery.trim().toLowerCase();
    const haystack = [row.vehicleName || "", row.vehiclePlateNumber || "", row.note || ""].join(" ").toLowerCase();
    const matchesSearch = !query || haystack.includes(query);

    return matchesTimeline && matchesScope && matchesVehicle && matchesSearch;
  });

  const activeCount = rows.filter((row) => getTimelineStatus(row, now) === "active").length;
  const upcomingCount = rows.filter((row) => getTimelineStatus(row, now) === "upcoming").length;
  const globalCount = rows.filter((row) => !row.vehicleId).length;

  const resetForm = () => {
    setEditingId(null);
    setVehicleId("");
    setStartDate("");
    setEndDate("");
    setNote("");
  };

  const closeDialog = () => {
    if (isSaving) return;
    setDialogOpen(false);
    resetForm();
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (row: BlockoutRow) => {
    setEditingId(row.id);
    setVehicleId(row.vehicleId || "");
    setStartDate(formatDateTimeInputInLaPaz(row.startDate));
    setEndDate(formatDateTimeInputInLaPaz(row.endDate));
    setNote(row.note || "");
    setDialogOpen(true);
  };

  const saveBlockout = async (formData: FormData) => {
    if (hasInvalidRange) {
      toast.error(t("admin.blockouts.messages.invalidDateRange"));
      return;
    }

    setIsSaving(true);
    const result = editingId
      ? await updateVehicleBlockoutAction(formData, locale)
      : await createVehicleBlockoutAction(formData, locale);
    setIsSaving(false);

    if (!result.success) {
      toast.error(
        result.error ||
          (editingId
            ? t("admin.blockouts.messages.updateFailed")
            : t("admin.blockouts.messages.createFailed"))
      );
      return;
    }

    toast.success(editingId ? t("admin.blockouts.messages.updated") : t("admin.blockouts.messages.created"));
    closeDialog();
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

  const openNativePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    const input = ref.current;
    if (!input) return;
    if (typeof (input as HTMLInputElement & { showPicker?: () => void }).showPicker === "function") {
      (input as HTMLInputElement & { showPicker: () => void }).showPicker();
      return;
    }

    input.focus();
    input.click();
  };

  return (
    <div className="space-y-6">
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

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className="max-w-3xl rounded-[1.75rem] border-slate-200 bg-[linear-gradient(180deg,#fffdf9_0%,#ffffff_28%)] p-0">
          <form action={saveBlockout}>
            <DialogHeader className="border-b border-slate-100 px-6 pt-6 pb-5">
              <DialogTitle className="text-2xl font-black tracking-tight text-slate-900">
                {editingId ? t("admin.blockouts.dialog.editTitle") : t("admin.blockouts.dialog.createTitle")}
              </DialogTitle>
              <DialogDescription className="max-w-2xl text-sm leading-6 text-slate-600">
                {editingId ? t("admin.blockouts.dialog.editDescription") : t("admin.blockouts.dialog.createDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]">
              <div className="space-y-5">
                {editingId ? <input type="hidden" name="blockoutId" value={editingId} /> : null}
                <div className="space-y-2">
                  <label htmlFor="blockout-vehicle" className="text-sm font-semibold text-slate-800">
                    {t("admin.blockouts.form.vehicleScope")}
                  </label>
                  <select
                    id="blockout-vehicle"
                    name="vehicleId"
                    value={vehicleId}
                    onChange={(event) => setVehicleId(event.target.value)}
                    className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-[0_10px_24px_-18px_hsl(var(--primary)/0.24)] outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200/80"
                  >
                    <option value="">{t("admin.blockouts.form.allVehicles")}</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {formatVehicleLabel(vehicle)}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs leading-5 text-slate-500">
                    {vehicleId ? t("admin.blockouts.form.vehicleHelper") : t("admin.blockouts.form.globalHelper")}
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="blockout-start" className="text-sm font-semibold text-slate-800">
                      {t("admin.blockouts.form.start")}
                    </label>
                    <div className="relative">
                      <Input
                        ref={startDateInputRef}
                        id="blockout-start"
                        name="startDate"
                        type="datetime-local"
                        value={startDate}
                        onChange={(event) => setStartDate(event.target.value)}
                        className="h-11 rounded-xl border-slate-200 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => openNativePicker(startDateInputRef)}
                        aria-label={`${t("admin.blockouts.form.start")} picker`}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                      >
                        <CalendarDays className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="blockout-end" className="text-sm font-semibold text-slate-800">
                      {t("admin.blockouts.form.end")}
                    </label>
                    <div className="relative">
                      <Input
                        ref={endDateInputRef}
                        id="blockout-end"
                        name="endDate"
                        type="datetime-local"
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                        className="h-11 rounded-xl border-slate-200 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => openNativePicker(endDateInputRef)}
                        aria-label={`${t("admin.blockouts.form.end")} picker`}
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                      >
                        <CalendarDays className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="blockout-note" className="text-sm font-semibold text-slate-800">
                    {t("admin.blockouts.form.reason")}
                  </label>
                  <Textarea
                    id="blockout-note"
                    name="note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="min-h-28 rounded-2xl border-slate-200"
                    placeholder={t("admin.blockouts.form.optionalNote")}
                  />
                  <p className="text-xs leading-5 text-slate-500">{t("admin.blockouts.form.reasonHelper")}</p>
                </div>
              </div>

              <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {t("admin.blockouts.form.helperTitle")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {t("admin.blockouts.form.dateTimeHelper", { timezone: LA_PAZ_TIME_ZONE })}
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/70">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {t("admin.blockouts.form.summaryScope")}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {vehicleId
                        ? formatVehicleLabel(vehicles.find((vehicle) => vehicle.id === vehicleId)) || t("admin.blockouts.form.singleVehicle")
                        : t("admin.blockouts.form.allVehicles")}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/70">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {t("admin.blockouts.form.summaryDuration")}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {durationLabel || t("admin.blockouts.form.durationPending")}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/70">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {t("admin.blockouts.form.summaryWindow")}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {parsedStart && parsedEnd
                        ? `${formatDateTime(parsedStart)} -> ${formatDateTime(parsedEnd)}`
                        : t("admin.blockouts.form.windowPending")}
                    </p>
                  </div>
                </div>

                {hasInvalidRange ? (
                  <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {t("admin.blockouts.form.invalidRange")}
                  </p>
                ) : null}
              </div>
            </div>

            <DialogFooter className="border-t border-slate-100 px-6 py-5">
              <Button type="button" variant="outline" onClick={closeDialog} disabled={isSaving} className="rounded-xl">
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isSaving || hasInvalidRange} className="rounded-xl">
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

      <div className="grid gap-4 xl:grid-cols-4">
        {[
          {
            label: t("admin.blockouts.cards.total"),
            value: rows.length,
            icon: CalendarRange,
            tone: "bg-slate-900 text-white",
          },
          {
            label: t("admin.blockouts.cards.active"),
            value: activeCount,
            icon: Clock3,
            tone: "bg-emerald-100 text-emerald-700",
          },
          {
            label: t("admin.blockouts.cards.global"),
            value: globalCount,
            icon: Globe2,
            tone: "bg-amber-100 text-amber-700",
          },
          {
            label: t("admin.blockouts.cards.upcoming"),
            value: upcomingCount,
            icon: Plus,
            tone: "bg-blue-100 text-blue-700",
          },
        ].map((item) => (
          <Card key={item.label} className="rounded-[1.6rem] border-slate-200 p-5">
            <CardContent className="flex items-start justify-between gap-4 px-0">
              <div>
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{item.value}</p>
              </div>
              <div className={`inline-flex size-12 items-center justify-center rounded-2xl ${item.tone}`}>
                <item.icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-[1.8rem] border-slate-200 p-6">
        <CardContent className="space-y-6 px-0">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">{t("admin.blockouts.workspace.title")}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                {t("admin.blockouts.workspace.description")}
              </p>
            </div>
            <Button onClick={openCreateDialog} className="rounded-xl">
              <Plus className="mr-2 size-4" />
              {t("admin.blockouts.actions.new")}
            </Button>
          </div>

          <div className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4 lg:grid-cols-[minmax(0,1.35fr)_repeat(3,minmax(0,0.75fr))]">
            <div className="space-y-2">
              <label htmlFor="blockout-search" className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {t("admin.blockouts.filters.searchLabel")}
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="blockout-search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t("admin.blockouts.filters.searchPlaceholder")}
                  className="h-11 rounded-xl border-slate-200 bg-white pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="scope-filter" className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {t("admin.blockouts.filters.scopeLabel")}
              </label>
              <select
                id="scope-filter"
                value={scopeFilter}
                onChange={(event) => setScopeFilter(event.target.value as ScopeFilter)}
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200/80"
              >
                <option value="all">{t("admin.blockouts.filters.allScopes")}</option>
                <option value="global">{t("admin.blockouts.filters.globalOnly")}</option>
                <option value="vehicle">{t("admin.blockouts.filters.vehicleOnly")}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="timeline-filter" className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {t("admin.blockouts.filters.timelineLabel")}
              </label>
              <select
                id="timeline-filter"
                value={timelineFilter}
                onChange={(event) => setTimelineFilter(event.target.value as TimelineFilter)}
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200/80"
              >
                <option value="all">{t("admin.blockouts.filters.allTimelines")}</option>
                <option value="active">{t("admin.blockouts.filters.active")}</option>
                <option value="upcoming">{t("admin.blockouts.filters.upcoming")}</option>
                <option value="past">{t("admin.blockouts.filters.past")}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="vehicle-filter" className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {t("admin.blockouts.filters.vehicleLabel")}
              </label>
              <select
                id="vehicle-filter"
                value={vehicleFilterId}
                onChange={(event) => setVehicleFilterId(event.target.value)}
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200/80"
              >
                <option value="all">{t("admin.blockouts.filters.allVehicles")}</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {formatVehicleLabel(vehicle)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              {t("admin.blockouts.filters.results", { count: filteredRows.length, total: rows.length })}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setScopeFilter("all");
                setTimelineFilter("all");
                setVehicleFilterId("all");
              }}
              className="rounded-xl"
            >
              {t("admin.blockouts.filters.clear")}
            </Button>
          </div>

          <div className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white">
            <Table className="bg-transparent">
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead>{t("admin.blockouts.table.scope")}</TableHead>
                  <TableHead>{t("admin.blockouts.table.start")}</TableHead>
                  <TableHead>{t("admin.blockouts.table.end")}</TableHead>
                  <TableHead>{t("admin.blockouts.table.status")}</TableHead>
                  <TableHead>{t("admin.blockouts.table.reason")}</TableHead>
                  <TableHead>{t("admin.blockouts.table.created")}</TableHead>
                  <TableHead className="text-right">{t("admin.blockouts.table.action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length ? filteredRows.map((row) => {
                  const status = getTimelineStatus(row, now);

                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-900">
                            {row.vehicleName
                              ? formatVehicleLabel({ name: row.vehicleName, plateNumber: row.vehiclePlateNumber })
                              : t("admin.blockouts.table.globalLabel")}
                          </div>
                          <div className="text-xs text-slate-500">
                            {row.vehicleId ? t("admin.blockouts.table.vehicleLabel") : t("admin.blockouts.table.allFleetLabel")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">{formatDateTime(row.startDate)}</TableCell>
                      <TableCell className="text-sm text-slate-700">{formatDateTime(row.endDate)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getTimelineBadgeClasses(status)}>
                          {t(`admin.blockouts.filters.${status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[260px]">
                        <CompactText text={row.note} expandedTitle={t("admin.blockouts.table.fullReason")} />
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">{formatDateTime(row.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(row)}
                            disabled={Boolean(isDeletingId)}
                            className="rounded-xl"
                          >
                            <SquarePen className="mr-2 size-4" />
                            {t("common.edit")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPendingDeleteId(row.id)}
                            disabled={isDeletingId === row.id}
                            className="rounded-xl text-red-600 hover:text-red-700"
                          >
                            {isDeletingId === row.id ? t("admin.blockouts.table.deleting") : t("common.delete")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-14 text-center">
                      <div className="mx-auto max-w-md space-y-2">
                        <p className="text-base font-semibold text-slate-900">{t("admin.blockouts.table.emptyTitle")}</p>
                        <p className="text-sm leading-6 text-slate-500">{t("admin.blockouts.table.emptyDescription")}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

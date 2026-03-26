"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteLocationAction } from "@/actions/locations";
import { LocationDialog } from "@/components/admin/LocationDialog";
import { CompactText } from "@/components/shared/CompactText";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";

type LocationRow = {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  _count?: {
    pickupBookings?: number;
    dropoffBookings?: number;
  };
};

export function LocationsTable({
  locations,
  locale,
}: {
  locations: LocationRow[];
  locale: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [selected, setSelected] = useState<LocationRow | Record<string, never> | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<"name" | "code" | "bookings">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  };

  const sortIndicator = (key: typeof sortKey) => (sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "");

  const sorted = useMemo(() => {
    const rows = [...locations];
    rows.sort((a, b) => {
      const bookingsA = (a._count?.pickupBookings ?? 0) + (a._count?.dropoffBookings ?? 0);
      const bookingsB = (b._count?.pickupBookings ?? 0) + (b._count?.dropoffBookings ?? 0);
      const valA =
        sortKey === "name"
          ? a.name.toLowerCase()
          : sortKey === "code"
            ? (a.code || "").toLowerCase()
            : bookingsA;
      const valB =
        sortKey === "name"
          ? b.name.toLowerCase()
          : sortKey === "code"
            ? (b.code || "").toLowerCase()
            : bookingsB;
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [locations, sortKey, sortDir]);

  const handleDelete = async (id: string) => {
    setBusyId(id);
    const result = await deleteLocationAction(id, locale);
    setBusyId(null);
    setPendingDeleteId(null);
    if (!result.success) {
      toast.error(result.error || t("admin.locations.errors.delete"));
      return;
    }
    toast.success(t("admin.locations.deleted"));
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <ConfirmActionDialog
        open={Boolean(pendingDeleteId)}
        onOpenChange={(open) => {
          if (!open && !busyId) setPendingDeleteId(null);
        }}
        title={t("admin.locations.deleteTitle")}
        description={t("admin.locations.deleteConfirm")}
        confirmLabel={t("common.delete")}
        destructive
        loading={Boolean(busyId)}
        onConfirm={() => pendingDeleteId ? handleDelete(pendingDeleteId) : undefined}
      />
      <Button onClick={() => setSelected({})}>
        <Plus className="h-4 w-4" />
        {t("admin.locations.add")}
      </Button>
      <LocationDialog location={(selected as any) || null} locale={locale} onClose={() => setSelected(null)} />

      <div className="overflow-hidden rounded-[1.6rem] bg-white shadow-[0_24px_56px_-32px_hsl(215_28%_17%/0.12)] ring-1 ring-[hsl(215_25%_27%/0.05)]">
        <Table className="bg-transparent">
          <TableHeader>
            <TableRow>
              <TableHead>
                <button type="button" onClick={() => toggleSort("name")}>
                  {t("admin.locations.name")}
                  {sortIndicator("name")}
                </button>
              </TableHead>
              <TableHead>
                <button type="button" onClick={() => toggleSort("code")}>
                  {t("admin.locations.code")}
                  {sortIndicator("code")}
                </button>
              </TableHead>
              <TableHead>{t("admin.locations.address")}</TableHead>
              <TableHead>
                <button type="button" onClick={() => toggleSort("bookings")}>
                  {t("admin.locations.bookings")}
                  {sortIndicator("bookings")}
                </button>
              </TableHead>
              <TableHead>{t("admin.locations.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((location) => {
              const pickupCount = location._count?.pickupBookings ?? 0;
              const dropoffCount = location._count?.dropoffBookings ?? 0;
              return (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.name}</TableCell>
                  <TableCell>{location.code || "-"}</TableCell>
                  <TableCell>
                    <CompactText text={location.address} expandedTitle={t("admin.locations.fullAddress")} />
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-slate-100 text-slate-700">{pickupCount + dropoffCount}</Badge>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" variant="outline" onClick={() => setSelected(location)}>
                      <Pencil className="h-4 w-4" />
                      {t("common.edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busyId === location.id}
                      onClick={() => setPendingDeleteId(location.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("common.delete")}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {sorted.length === 0 && (
        <div className="rounded-[1.3rem] border border-dashed border-[hsl(var(--border))] bg-white/85 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
          {t("admin.locations.empty")}
        </div>
      )}
    </div>
  );
}

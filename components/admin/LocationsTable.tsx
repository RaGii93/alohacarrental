"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteLocationAction } from "@/actions/locations";
import { LocationDialog } from "@/components/admin/LocationDialog";

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
  const [sortKey, setSortKey] = useState<"name" | "code" | "bookings">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const tOr = (key: string, fallback: string) => (t.has(key as any) ? t(key as any) : fallback);

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
    if (!window.confirm(tOr("admin.locations.deleteConfirm", "Delete this location?"))) return;
    setBusyId(id);
    const result = await deleteLocationAction(id, locale);
    setBusyId(null);
    if (!result.success) {
      toast.error(result.error || tOr("admin.locations.errors.delete", "Failed to delete location"));
      return;
    }
    toast.success(tOr("admin.locations.deleted", "Location deleted"));
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setSelected({})}>+ {tOr("admin.locations.add", "Add Location")}</Button>
      <LocationDialog location={(selected as any) || null} locale={locale} onClose={() => setSelected(null)} />

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button type="button" onClick={() => toggleSort("name")}>
                  {tOr("admin.locations.name", "Name")}
                  {sortIndicator("name")}
                </button>
              </TableHead>
              <TableHead>
                <button type="button" onClick={() => toggleSort("code")}>
                  {tOr("admin.locations.code", "Code")}
                  {sortIndicator("code")}
                </button>
              </TableHead>
              <TableHead>{tOr("admin.locations.address", "Address")}</TableHead>
              <TableHead>
                <button type="button" onClick={() => toggleSort("bookings")}>
                  {tOr("admin.locations.bookings", "Bookings")}
                  {sortIndicator("bookings")}
                </button>
              </TableHead>
              <TableHead>{tOr("admin.locations.actions", "Actions")}</TableHead>
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
                  <TableCell>{location.address || "-"}</TableCell>
                  <TableCell>
                    <Badge className="bg-slate-100 text-slate-700">{pickupCount + dropoffCount}</Badge>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" variant="outline" onClick={() => setSelected(location)}>
                      {tOr("common.edit", "Edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busyId === location.id}
                      onClick={() => handleDelete(location.id)}
                    >
                      {tOr("common.delete", "Delete")}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {sorted.length === 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {tOr("admin.locations.empty", "No locations found")}
        </div>
      )}
    </div>
  );
}

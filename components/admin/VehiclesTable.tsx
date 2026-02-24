"use client";

import { useState } from "react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { VehicleDialog } from "./VehicleDialog";
import { deleteVehicleAction, setVehicleStatusAction } from "@/actions/vehicles";

interface Vehicle {
  id: string;
  name: string;
  plateNumber?: string;
  categoryId?: string;
  // category can be a plain string (legacy) or a relation object { id, name }
  category?: string | { id?: string; name?: string } | null;
  dailyRate: number;
  status: string;
  notes?: string;
  createdAt: Date;
}

interface CategoryOption {
  id: string;
  name: string;
}

export function VehiclesTable({
  vehicles,
  categories,
  locale,
}: {
  vehicles: Vehicle[];
  categories: CategoryOption[];
  locale: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Partial<Vehicle> | null>(null);
  const [sortKey, setSortKey] = useState<"name" | "plateNumber" | "category" | "dailyRate" | "status">("name");
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
    const rows = [...vehicles];
    rows.sort((a, b) => {
      const categoryA = typeof a.category === "string" ? a.category : a.category?.name || "";
      const categoryB = typeof b.category === "string" ? b.category : b.category?.name || "";
      const valA =
        sortKey === "name"
          ? (a.name || "").toLowerCase()
          : sortKey === "plateNumber"
            ? (a.plateNumber || "").toLowerCase()
            : sortKey === "category"
              ? categoryA.toLowerCase()
              : sortKey === "dailyRate"
                ? a.dailyRate
                : (a.status || "").toLowerCase();
      const valB =
        sortKey === "name"
          ? (b.name || "").toLowerCase()
          : sortKey === "plateNumber"
            ? (b.plateNumber || "").toLowerCase()
            : sortKey === "category"
              ? categoryB.toLowerCase()
              : sortKey === "dailyRate"
                ? b.dailyRate
                : (b.status || "").toLowerCase();
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [vehicles, sortKey, sortDir]);

  const pageRows = sorted;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-800";
      case "ON_RENT":
        return "bg-blue-100 text-blue-800";
      case "INACTIVE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDelete = async (vehicleId: string) => {
    if (!window.confirm("Are you sure you want to delete this vehicle?")) {
      return;
    }

    setIsLoading(true);
    const result = await deleteVehicleAction(vehicleId, locale);
    setIsLoading(false);

    if (result.success) {
      toast.success(t("admin.vehicles.deleted"));
      router.refresh();
    } else {
      toast.error(result.error || t("admin.vehicles.errors.delete"));
    }
  };

  const handleStatusChange = async (
    vehicleId: string,
    newStatus: "ACTIVE" | "ON_RENT" | "MAINTENANCE" | "INACTIVE"
  ) => {
    setIsLoading(true);
    const result = await setVehicleStatusAction(vehicleId, newStatus, locale);
    setIsLoading(false);

    if (result.success) {
      toast.success(t("admin.vehicles.statusUpdated"));
      router.refresh();
    } else {
      toast.error(result.error || t("admin.vehicles.errors.updateStatus"));
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setSelectedVehicle({} as Partial<Vehicle>)}>
        + {t("admin.vehicles.add")}
      </Button>

      <VehicleDialog
        vehicle={selectedVehicle as any}
        categories={categories}
        locale={locale}
        onClose={() => setSelectedVehicle(null)}
      />

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><button type="button" onClick={() => toggleSort("name")}>{t("admin.vehicles.table.name")}{sortIndicator("name")}</button></TableHead>
              <TableHead><button type="button" onClick={() => toggleSort("plateNumber")}>{t("admin.vehicles.table.plate")}{sortIndicator("plateNumber")}</button></TableHead>
              <TableHead><button type="button" onClick={() => toggleSort("category")}>{t("admin.vehicles.table.category")}{sortIndicator("category")}</button></TableHead>
              <TableHead><button type="button" onClick={() => toggleSort("dailyRate")}>{t("admin.vehicles.table.rate")}{sortIndicator("dailyRate")}</button></TableHead>
              <TableHead><button type="button" onClick={() => toggleSort("status")}>{t("admin.vehicles.table.status")}{sortIndicator("status")}</button></TableHead>
              <TableHead>{t("admin.vehicles.table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell className="font-medium">{vehicle.name}</TableCell>
                <TableCell>{vehicle.plateNumber || "-"}</TableCell>
                <TableCell>{
                  typeof vehicle.category === "string"
                    ? vehicle.category
                    : vehicle.category?.name || "-"
                }</TableCell>
                <TableCell>
                  ${(vehicle.dailyRate / 100).toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(vehicle.status)}>
                    {vehicle.status}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedVehicle(vehicle)}
                  >
                    {t("common.edit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(vehicle.id)}
                    disabled={isLoading}
                  >
                    {t("common.delete")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {vehicles.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {t("admin.vehicles.empty")}
        </div>
      )}
    </div>
  );
}

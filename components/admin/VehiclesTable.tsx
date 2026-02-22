"use client";

import { useState } from "react";
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-800";
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
    newStatus: "ACTIVE" | "MAINTENANCE" | "INACTIVE"
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
              <TableHead>{t("admin.vehicles.table.name")}</TableHead>
              <TableHead>{t("admin.vehicles.table.plate")}</TableHead>
              <TableHead>{t("admin.vehicles.table.category")}</TableHead>
              <TableHead>{t("admin.vehicles.table.rate")}</TableHead>
              <TableHead>{t("admin.vehicles.table.status")}</TableHead>
              <TableHead>{t("admin.vehicles.table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((vehicle) => (
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

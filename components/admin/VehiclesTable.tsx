"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  category?: string;
  dailyRate: number;
  status: string;
  notes?: string;
  createdAt: Date;
}

export function VehiclesTable({
  vehicles,
  locale,
}: {
  vehicles: Vehicle[];
  locale: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

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
      toast.success("Vehicle deleted successfully");
      router.refresh();
    } else {
      toast.error(result.error || "Error deleting vehicle");
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
      toast.success("Vehicle status updated");
      router.refresh();
    } else {
      toast.error(result.error || "Error updating vehicle");
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setSelectedVehicle({} as Vehicle)}>
        + Add Vehicle
      </Button>

      <VehicleDialog
        vehicle={selectedVehicle}
        locale={locale}
        onClose={() => setSelectedVehicle(null)}
      />

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Plate</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Daily Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell className="font-medium">{vehicle.name}</TableCell>
                <TableCell>{vehicle.plateNumber || "-"}</TableCell>
                <TableCell>{vehicle.category || "-"}</TableCell>
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
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(vehicle.id)}
                    disabled={isLoading}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {vehicles.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No vehicles found
        </div>
      )}
    </div>
  );
}

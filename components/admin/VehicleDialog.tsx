"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { vehicleFormSchema } from "@/lib/validators";
import { createVehicleAction, updateVehicleAction } from "@/actions/vehicles";

interface Vehicle {
  id?: string;
  name?: string;
  plateNumber?: string;
  categoryId?: string;
  dailyRate?: number;
  status?: string;
  notes?: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

export function VehicleDialog({
  vehicle,
  categories,
  locale,
  onClose,
}: {
  vehicle: Vehicle | null;
  categories: CategoryOption[];
  locale: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(!!vehicle);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      name: vehicle?.name || "",
      plateNumber: vehicle?.plateNumber || "",
      categoryId: vehicle?.categoryId || "",
      dailyRate: vehicle?.dailyRate ? vehicle.dailyRate / 100 : 0,
      status: (vehicle?.status as "ACTIVE" | "MAINTENANCE" | "INACTIVE") || "ACTIVE",
      notes: vehicle?.notes || "",
    },
  });

  useEffect(() => {
    setIsOpen(!!vehicle);
    if (vehicle) {
      form.reset({
        name: vehicle.name || "",
        plateNumber: vehicle.plateNumber || "",
        categoryId: vehicle.categoryId || "",
        dailyRate: vehicle.dailyRate ? vehicle.dailyRate / 100 : 0,
        status: (vehicle?.status as "ACTIVE" | "MAINTENANCE" | "INACTIVE") || "ACTIVE",
        notes: vehicle.notes || "",
      });
    }
  }, [vehicle, form]);

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);

    try {
      if (vehicle?.id) {
        const result = await updateVehicleAction(vehicle.id, values, locale);
        if (!result.success) {
          toast.error(result.error || "Error updating vehicle");
        } else {
          toast.success("Vehicle updated successfully");
          setIsOpen(false);
          onClose();
          router.refresh();
        }
      } else {
        const result = await createVehicleAction(values, locale);
        if (!result.success) {
          toast.error(result.error || "Error creating vehicle");
        } else {
          toast.success("Vehicle created successfully");
          setIsOpen(false);
          onClose();
          router.refresh();
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) onClose();
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {vehicle?.id ? "Edit Vehicle" : "Add Vehicle"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Kia Picanto #1" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="plateNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plate Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., ABC-1234" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dailyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Rate ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Optional notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  onClose();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

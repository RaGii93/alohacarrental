"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { bookingFormSchemaRefined } from "@/lib/validators";
import { isLicenseActive } from "@/lib/license";
import { createBookingAction } from "@/actions/booking";
import { useRouter } from "next/navigation";

interface Vehicle {
  id: string;
  name: string;
  dailyRate: number;
}

export function BookingForm({
  locale,
  vehicles,
}: {
  locale: string;
  vehicles: Vehicle[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(bookingFormSchemaRefined),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      vehicleId: "",
      startDate: new Date(),
      endDate: new Date(),
      pickupLocation: "",
      dropoffLocation: "",
      notes: "",
    },
  });

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("customerName", values.customerName);
      formData.append("customerEmail", values.customerEmail);
      formData.append("customerPhone", values.customerPhone);
      formData.append("vehicleId", values.vehicleId);
      formData.append("startDate", values.startDate.toISOString());
      formData.append("endDate", values.endDate.toISOString());
      formData.append("pickupLocation", values.pickupLocation || "");
      formData.append("dropoffLocation", values.dropoffLocation || "");
      formData.append("notes", values.notes || "");

      const result = await createBookingAction(formData, locale);

      if (!result.success) {
        if (result.error === "BOOKING_DISABLED") {
          toast.error(t("booking.errors.bookingDisabled"));
        } else if (result.error === "VEHICLE_UNAVAILABLE") {
          toast.error(t("booking.errors.vehicleUnavailable"));
        } else {
          toast.error(result.error || t("common.error"));
        }
      } else {
        toast.success(t("common.success"));
        router.push(result.redirectUrl || `/${locale}/book/success/${result.bookingId}`);
      }
    } catch (error: any) {
      toast.error(error.message || t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const licenseActive = isLicenseActive();

  return (
    <Card className="w-full max-w-2xl mx-auto p-6">
      {!licenseActive && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t("booking.errors.bookingDisabled")}</AlertDescription>
        </Alert>
      )}

      <h2 className="text-2xl font-bold mb-6">{t("booking.title")}</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("booking.customerName")}</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!licenseActive} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customerEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("booking.customerEmail")}</FormLabel>
                <FormControl>
                  <Input type="email" {...field} disabled={!licenseActive} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customerPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("booking.customerPhone")}</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!licenseActive} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vehicleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("booking.selectVehicle")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={!licenseActive}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("booking.startDate")}</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={
                        field.value instanceof Date
                          ? field.value.toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                      disabled={!licenseActive}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("booking.endDate")}</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={
                        field.value instanceof Date
                          ? field.value.toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                      disabled={!licenseActive}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="pickupLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("booking.pickupLocation")}</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!licenseActive} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dropoffLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("booking.dropoffLocation")}</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!licenseActive} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("booking.notes")}</FormLabel>
                <FormControl>
                  <Textarea {...field} disabled={!licenseActive} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isSubmitting || !licenseActive}
            className="w-full"
          >
            {isSubmitting ? t("common.loading") : t("booking.submit")}
          </Button>
        </form>
      </Form>
    </Card>
  );
}

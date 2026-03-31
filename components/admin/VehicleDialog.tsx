"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const MANUAL_VEHICLE_STATUS_OPTIONS = [
  { value: "ACTIVE", labelKey: "admin.vehicles.active" },
  { value: "MAINTENANCE", labelKey: "admin.vehicles.maintenance" },
  { value: "INACTIVE", labelKey: "admin.vehicles.inactive" },
] as const;

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
  const t = useTranslations();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(!!vehicle);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      name: vehicle?.name || "",
      plateNumber: vehicle?.plateNumber || "",
      categoryId: vehicle?.categoryId || "",
      dailyRate: vehicle?.dailyRate ? vehicle.dailyRate / 100 : 0,
      status: (vehicle?.status as "ACTIVE" | "ON_RENT" | "MAINTENANCE" | "INACTIVE") || "ACTIVE",
      notes: vehicle?.notes || "",
    },
  });

  useEffect(() => {
    setIsOpen(!!vehicle);
    setCurrentStep(0);
    if (vehicle) {
      form.reset({
        name: vehicle.name || "",
        plateNumber: vehicle.plateNumber || "",
        categoryId: vehicle.categoryId || "",
        dailyRate: vehicle.dailyRate ? vehicle.dailyRate / 100 : 0,
        status: (vehicle?.status as "ACTIVE" | "ON_RENT" | "MAINTENANCE" | "INACTIVE") || "ACTIVE",
        notes: vehicle.notes || "",
      });
    }
  }, [vehicle, form]);

  const steps = [
    {
      key: "identity",
      title: t("admin.vehicles.steps.identity"),
      description: t("admin.vehicles.steps.identityDescription"),
    },
    {
      key: "assignment",
      title: t("admin.vehicles.steps.assignment"),
      description: t("admin.vehicles.steps.assignmentDescription"),
    },
    {
      key: "status",
      title: t("admin.vehicles.steps.status"),
      description: t("admin.vehicles.steps.statusDescription"),
    },
  ] as const;

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);

    try {
      if (vehicle?.id) {
        const result = await updateVehicleAction(vehicle.id, values, locale);
        if (!result.success) {
          toast.error(result.error || t("admin.vehicles.errors.update"));
        } else {
          toast.success(t("admin.vehicles.updated"));
          setIsOpen(false);
          onClose();
          router.refresh();
        }
      } else {
        const result = await createVehicleAction(values, locale);
        if (!result.success) {
          toast.error(result.error || t("admin.vehicles.errors.create"));
        } else {
          toast.success(t("admin.vehicles.created"));
          setIsOpen(false);
          onClose();
          router.refresh();
        }
      }
    } catch (error: any) {
      toast.error(error.message || t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {vehicle?.id ? <Pencil className="mr-2 inline h-5 w-5" /> : <Plus className="mr-2 inline h-5 w-5" />}
            {vehicle?.id ? t("admin.vehicles.edit") : t("admin.vehicles.add")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              {steps.map((step, index) => (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => setCurrentStep(index)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    currentStep === index
                      ? "border-sky-300 bg-sky-50 shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {t("admin.vehicles.stepCounter", { current: index + 1, total: steps.length })}
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">{step.title}</p>
                  <p className="mt-1 text-xs leading-5">{step.description}</p>
                </button>
              ))}
            </div>

            <div className="min-h-[360px] space-y-4 rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#fbfdff)] p-5">
              {currentStep === 0 ? (
                <>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-slate-900">{steps[0].title}</p>
                    <p className="text-sm text-slate-600">{steps[0].description}</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.vehicles.name")}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t("admin.vehicles.placeholders.name")} />
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
                        <FormLabel>{t("admin.vehicles.plate")}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t("admin.vehicles.placeholders.plate")} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : null}

              {currentStep === 1 ? (
                <>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-slate-900">{steps[1].title}</p>
                    <p className="text-sm text-slate-600">{steps[1].description}</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.vehicles.category")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("admin.vehicles.placeholders.selectCategory")} />
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
                        <FormLabel>{t("admin.vehicles.dailyRate")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value || "0"))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : null}

              {currentStep === 2 ? (
                <>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-slate-900">{steps[2].title}</p>
                    <p className="text-sm text-slate-600">{steps[2].description}</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.vehicles.status")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value === "ON_RENT" ? "ACTIVE" : field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MANUAL_VEHICLE_STATUS_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {t(option.labelKey as any)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">
                          On-rent status is controlled by the booking and return flow, so it is not set manually here.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.vehicles.notes")}</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ""} placeholder={t("admin.vehicles.placeholders.notes")} className="min-h-28" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : null}
            </div>

            <div className="flex gap-4 justify-end border-t border-slate-200 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  onClose();
                }}
              >
                <X className="h-4 w-4" />
                {t("common.cancel")}
              </Button>
              {currentStep > 0 ? (
                <Button type="button" variant="outline" onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}>
                  {t("common.previous")}
                </Button>
              ) : null}
              {currentStep < steps.length - 1 ? (
                <Button type="button" onClick={() => setCurrentStep((step) => Math.min(steps.length - 1, step + 1))}>
                  {t("common.next")}
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="h-4 w-4" />
                  {isSubmitting ? t("admin.settings.saving") : t("common.save")}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

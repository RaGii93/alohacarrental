"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categoryFormSchema } from "@/lib/validators";
import { createCategoryAction, updateCategoryAction, uploadCategoryImageAction } from "@/actions/categories";
import { getBlobProxyUrl } from "@/lib/blob";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getCategoryFeatureIds } from "@/lib/vehicle-features";

type Category = {
  id?: string;
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  seats?: number;
  transmission?: "AUTOMATIC" | "MANUAL";
  features?: Array<{ featureId?: string; feature?: { id: string; name: string; isActive?: boolean } | null }>;
  dailyRate?: number;
  fuelChargePerQuarter?: number;
  sortOrder?: number;
  isActive?: boolean;
};

export function CategoryDialog({
  category,
  availableFeatures,
  locale,
  onClose,
}: {
  category: Category | null;
  availableFeatures: Array<{ id: string; name: string; isActive: boolean }>;
  locale: string;
  onClose: () => void;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(!!category);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
      imageUrl: category?.imageUrl || "",
      seats: category?.seats ?? 5,
      transmission: category?.transmission || "AUTOMATIC",
      featureIds: category ? getCategoryFeatureIds(category) : [],
      dailyRate: category?.dailyRate ? category.dailyRate / 100 : 0,
      fuelChargePerQuarter: category?.fuelChargePerQuarter ? category.fuelChargePerQuarter / 100 : 25,
      sortOrder: category?.sortOrder ?? 0,
      isActive: category?.isActive ?? true,
    },
  });

  useEffect(() => {
    setIsOpen(!!category);
    setCurrentStep(0);
    if (category) {
      form.reset({
        name: category.name || "",
        description: category.description || "",
        imageUrl: category.imageUrl || "",
        seats: category.seats ?? 5,
        transmission: category.transmission || "AUTOMATIC",
        featureIds: getCategoryFeatureIds(category),
        dailyRate: category.dailyRate ? category.dailyRate / 100 : 0,
        fuelChargePerQuarter: category.fuelChargePerQuarter ? category.fuelChargePerQuarter / 100 : 25,
        sortOrder: category.sortOrder ?? 0,
        isActive: category.isActive ?? true,
      });
    }
  }, [category, form]);

  const steps = [
    {
      key: "basics",
      title: t("admin.categories.steps.basics"),
      description: t("admin.categories.steps.basicsDescription"),
    },
    {
      key: "pricing",
      title: t("admin.categories.steps.pricing"),
      description: t("admin.categories.steps.pricingDescription"),
    },
    {
      key: "options",
      title: t("admin.categories.steps.options"),
      description: t("admin.categories.steps.optionsDescription"),
    },
  ] as const;

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const result = category?.id
        ? await updateCategoryAction(category.id, values, locale)
        : await createCategoryAction(values, locale);

      if (!result.success) {
        toast.error(result.error || t("admin.categories.messages.saveFailed"));
      } else {
        toast.success(category?.id ? t("admin.categories.messages.updated") : t("admin.categories.messages.created"));
        setIsOpen(false);
        onClose();
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{category?.id ? t("admin.categories.edit") : t("admin.categories.add")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    {t("admin.categories.stepCounter", { current: index + 1, total: steps.length })}
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">{step.title}</p>
                  <p className="mt-1 text-xs leading-5">{step.description}</p>
                </button>
              ))}
            </div>

            <div className="min-h-[420px] space-y-4 rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#fbfdff)] p-5">
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
                        <FormLabel>{t("admin.categories.name")}</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.categories.description")}</FormLabel>
                        <FormControl><Textarea {...field} value={field.value || ""} className="min-h-28" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin.categories.image")}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder={t("admin.categories.imageUrl")} />
                        </FormControl>
                        <div className="mt-2 flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/png,image/jpeg"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setIsUploadingImage(true);
                              const fd = new FormData();
                              fd.append("image", file);
                              const uploaded = await uploadCategoryImageAction(fd);
                              setIsUploadingImage(false);
                              if (!uploaded.success || !uploaded.imageUrl) {
                                toast.error(uploaded.error || t("admin.categories.messages.imageUploadFailed"));
                                return;
                              }
                              form.setValue("imageUrl", uploaded.imageUrl, { shouldDirty: true });
                              toast.success(t("admin.categories.messages.imageUploaded"));
                            }}
                          />
                        </div>
                        {field.value ? (
                          <img
                            src={field.value.startsWith("/") ? field.value : getBlobProxyUrl(field.value) || field.value}
                            alt={t("admin.categories.previewAlt")}
                            className="mt-3 h-28 w-full rounded-xl border object-cover"
                          />
                        ) : null}
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
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dailyRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("admin.categories.dailyRate")}</FormLabel>
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
                    <FormField
                      control={form.control}
                      name="fuelChargePerQuarter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("admin.categories.fuelChargePerQuarter")}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value || "0"))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sortOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("admin.categories.sortOrder")}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value || "0", 10))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(!!checked)} />
                          </FormControl>
                          <FormLabel>{t("admin.categories.active")}</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              ) : null}

              {currentStep === 2 ? (
                <>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-slate-900">{steps[2].title}</p>
                    <p className="text-sm text-slate-600">{steps[2].description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="seats"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("admin.categories.seats")}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={2}
                              max={12}
                              value={field.value}
                              onChange={(e) => field.onChange(parseInt(e.target.value || "5", 10))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="transmission"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("admin.categories.transmission")}</FormLabel>
                          <FormControl>
                            <select
                              className="h-10 w-full rounded-md border px-3 text-sm"
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value as "AUTOMATIC" | "MANUAL")}
                            >
                              <option value="AUTOMATIC">{t("admin.categories.automatic")}</option>
                              <option value="MANUAL">{t("admin.categories.manual")}</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="featureIds"
                    render={({ field }) => {
                      const selected = new Set(field.value || []);
                      return (
                        <FormItem className="space-y-3">
                          <div className="space-y-1">
                            <FormLabel>{t("admin.categories.features")}</FormLabel>
                            <p className="text-xs text-muted-foreground">{t("admin.categories.featuresHint")}</p>
                          </div>
                          <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:grid-cols-2">
                            {availableFeatures.map((feature) => (
                              <label
                                key={feature.id}
                                className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm shadow-sm transition ${
                                  selected.has(feature.id) ? "border-sky-200 bg-sky-50" : "border-white bg-white"
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <Checkbox
                                    checked={selected.has(feature.id)}
                                    onCheckedChange={(checked) => {
                                      const next = checked
                                        ? [...selected, feature.id]
                                        : (field.value || []).filter((id: string) => id !== feature.id);
                                      field.onChange(next);
                                    }}
                                  />
                                  <span>{feature.name}</span>
                                </span>
                                {!feature.isActive ? <Badge variant="secondary">{t("admin.features.status.archived")}</Badge> : null}
                              </label>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">{t("admin.categories.featuresFlowTitle")}</p>
                    <p className="mt-1">{t("admin.categories.featuresFlowDescription")}</p>
                  </div>
                </>
              ) : null}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
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
                <Button type="submit" disabled={isSubmitting || isUploadingImage}>
                  {isSubmitting ? t("admin.settings.saving") : isUploadingImage ? t("admin.categories.uploading") : t("common.save")}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

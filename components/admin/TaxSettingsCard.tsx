"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  updateMinimumBookingDaysAction,
  updateTaxPercentageAction,
} from "@/actions/settings";

export function TaxSettingsCard({
  locale,
  initialTaxPercentage,
  initialMinimumBookingDays,
}: {
  locale: string;
  initialTaxPercentage: number;
  initialMinimumBookingDays: number;
}) {
  const t = useTranslations();
  const [taxPercentage, setTaxPercentage] = useState(String(initialTaxPercentage));
  const [minimumBookingDays, setMinimumBookingDays] = useState(String(initialMinimumBookingDays));
  const [isSaving, setIsSaving] = useState(false);

  const onSave = async () => {
    const parsed = Number(taxPercentage);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      toast.error(t("admin.settings.errors.invalidTax"));
      return;
    }
    const parsedMinimumDays = Number(minimumBookingDays);
    if (!Number.isFinite(parsedMinimumDays) || parsedMinimumDays < 1 || parsedMinimumDays > 365) {
      toast.error(t("admin.settings.errors.invalidMinDays"));
      return;
    }

    setIsSaving(true);
    const [taxResult, minDaysResult] = await Promise.all([
      updateTaxPercentageAction(parsed, locale),
      updateMinimumBookingDaysAction(parsedMinimumDays, locale),
    ]);
    setIsSaving(false);

    if (!taxResult.success || !minDaysResult.success) {
      toast.error(taxResult.error || minDaysResult.error || t("admin.settings.errors.updateFailed"));
      return;
    }

    setTaxPercentage(String(taxResult.taxPercentage));
    setMinimumBookingDays(String(minDaysResult.minimumBookingDays));
    toast.success(
      t("admin.settings.success.updated", {
        tax: taxResult.taxPercentage,
        days: minDaysResult.minimumBookingDays,
      })
    );
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold">{t("admin.settings.title")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("admin.settings.subtitle")}
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full sm:w-56">
          <label className="mb-1 block text-sm font-medium">{t("admin.settings.taxPercentage")}</label>
          <Input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={taxPercentage}
            onChange={(e) => setTaxPercentage(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-56">
          <label className="mb-1 block text-sm font-medium">{t("admin.settings.minimumBookingDays")}</label>
          <Input
            type="number"
            min={1}
            max={365}
            step={1}
            value={minimumBookingDays}
            onChange={(e) => setMinimumBookingDays(e.target.value)}
          />
        </div>
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? t("admin.settings.saving") : t("common.save")}
        </Button>
      </div>
    </Card>
  );
}

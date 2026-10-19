"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CustomDailyRateInput({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const t = useTranslations("bookingOperations");
  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
      <Label htmlFor="custom-daily-rate">{t("customDailyRate")}</Label>
      <Input id="custom-daily-rate" type="number" min="0.01" max="1000000" step="0.01" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} placeholder={t("categoryPrice")} />
      <p className="text-sm text-slate-600">{t("customDailyRateHelp")}</p>
    </div>
  );
}

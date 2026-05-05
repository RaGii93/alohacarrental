"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentPreview } from "@/components/shared/DocumentPreview";
import { addLaPazDays, getLaPazToday, getLaPazTodayPlusYears, startOfLaPazDay } from "@/lib/timezone";
import { isAdditionalDriverAdult, isAdditionalDriverLicenseValid, MINIMUM_DRIVER_AGE } from "@/lib/additional-drivers";

export type AdditionalDriverFormValue = {
  id?: string;
  fullName: string;
  birthDate: Date | null;
  driverLicenseNumber: string;
  licenseExpiryDate: Date | null;
  driverLicenseUrl: string;
  driverLicenseDeletedAt?: Date | null;
};

const LICENSE_EXPIRY_FROM_YEAR = 2026;
const LICENSE_EXPIRY_TO_YEAR = 2041;

export function AdditionalDriversEditor({
  drivers,
  onChange,
  rentalStartDate,
  disabled = false,
}: {
  drivers: AdditionalDriverFormValue[];
  onChange: (drivers: AdditionalDriverFormValue[]) => void;
  rentalStartDate: Date | null;
  disabled?: boolean;
}) {
  const t = useTranslations();
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const buildEmptyDriver = (): AdditionalDriverFormValue => ({
    fullName: "",
    birthDate: null,
    driverLicenseNumber: "",
    licenseExpiryDate: null,
    driverLicenseUrl: "",
  });

  const updateDriver = (index: number, updates: Partial<AdditionalDriverFormValue>) => {
    onChange(drivers.map((driver, currentIndex) => (currentIndex === index ? { ...driver, ...updates } : driver)));
  };

  const syncDriverCount = (nextCount: number) => {
    const safeCount = Math.max(0, Math.min(6, nextCount));
    if (safeCount === drivers.length) return;
    if (safeCount < drivers.length) {
      onChange(drivers.slice(0, safeCount));
      return;
    }
    onChange([...drivers, ...Array.from({ length: safeCount - drivers.length }, buildEmptyDriver)]);
  };

  const handleFileUpload = async (index: number, file: File) => {
    setUploadingIndex(index);
    try {
      const formData = new FormData();
      formData.append("driverLicense", file);

      const response = await fetch("/api/upload/license", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        updateDriver(index, { driverLicenseUrl: result.driverLicenseUrl });
        toast.success(t("common.success"));
      } else {
        toast.error(result.error || t("booking.errors.uploadFailed"));
      }
    } catch {
      toast.error(t("booking.errors.uploadFailed"));
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleFileChange = (index: number, file?: File) => {
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t("booking.errors.fileType"));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error(t("booking.errors.fileSize"));
      return;
    }
    void handleFileUpload(index, file);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[#111111]">{t("booking.additionalDrivers.title")}</h3>
          <p className="text-sm text-[#57534e]">{t("booking.additionalDrivers.description")}</p>
        </div>
        <div className="w-[170px]">
          <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#78716c]">
            {t("booking.additionalDrivers.countLabel")}
          </Label>
          <Select
            value={String(drivers.length)}
            onValueChange={(value) => syncDriverCount(Number(value))}
            disabled={disabled}
          >
            <SelectTrigger className="h-11 rounded-xl border-[#ece7e2] bg-white text-[#111111]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 7 }, (_, count) => (
                <SelectItem key={count} value={String(count)}>
                  {count}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-2 text-xs text-[#78716c]">{t("booking.additionalDrivers.countHelp")}</p>
        </div>
      </div>

      {drivers.length === 0 ? (
        <div className="rounded-[1rem] border border-dashed border-[#e7dcd5] bg-[#faf8f6] p-4 text-sm text-[#78716c]">
          {t("booking.additionalDrivers.empty")}
        </div>
      ) : null}

      {drivers.map((driver, index) => {
        const ageValid = isAdditionalDriverAdult(driver.birthDate);
        const licenseValid = isAdditionalDriverLicenseValid(
          driver.licenseExpiryDate,
          rentalStartDate ? startOfLaPazDay(rentalStartDate) : null
        );

        return (
          <Card key={driver.id || index} className="rounded-[1.5rem] border-[#efe7df] bg-white shadow-[0_24px_60px_-46px_rgba(0,0,0,0.16)]">
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#111111]">
                    {t("booking.additionalDrivers.driverLabel", { number: index + 1 })}
                  </p>
                  <p className="text-xs text-[#78716c]">{t("booking.additionalDrivers.requiredHint")}</p>
                </div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#b91c1c]">
                  {t("booking.additionalDrivers.countLabel")} {index + 1}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label className="mb-2 block font-semibold text-[#44403c]">{t("booking.additionalDrivers.fullName")}</Label>
                  <Input
                    value={driver.fullName}
                    onChange={(e) => updateDriver(index, { fullName: e.target.value })}
                    disabled={disabled}
                    className="h-11 rounded-xl border-[#ece7e2] bg-white text-[#111111]"
                  />
                </div>
                <div>
                  <Label className="mb-2 block font-semibold text-[#44403c]">{t("booking.additionalDrivers.licenseNumber")}</Label>
                  <Input
                    value={driver.driverLicenseNumber}
                    onChange={(e) => updateDriver(index, { driverLicenseNumber: e.target.value })}
                    disabled={disabled}
                    className="h-11 rounded-xl border-[#ece7e2] bg-white text-[#111111]"
                  />
                </div>
                <div>
                  <Label className="mb-2 block font-semibold text-[#44403c]">{t("booking.additionalDrivers.birthDate")}</Label>
                  <DatePicker
                    value={driver.birthDate}
                    onChange={(date) => updateDriver(index, { birthDate: date })}
                    disabled={disabled}
                    placeholder={t("booking.additionalDrivers.birthDate")}
                    maxDate={getLaPazTodayPlusYears(-MINIMUM_DRIVER_AGE)}
                    className="h-11 rounded-xl border-[#ece7e2] bg-white text-[#111111]"
                  />
                  {driver.birthDate && !ageValid ? (
                    <p className="mt-1 text-xs text-red-600">{t("booking.errors.ageMinimum")}</p>
                  ) : null}
                </div>
                <div>
                  <Label className="mb-2 block font-semibold text-[#44403c]">{t("booking.additionalDrivers.licenseExpiryDate")}</Label>
                  <DatePicker
                    value={driver.licenseExpiryDate}
                    onChange={(date) => updateDriver(index, { licenseExpiryDate: date })}
                    disabled={disabled}
                    placeholder={t("booking.additionalDrivers.licenseExpiryDate")}
                    fromYear={LICENSE_EXPIRY_FROM_YEAR}
                    toYear={LICENSE_EXPIRY_TO_YEAR}
                    minDate={addLaPazDays(getLaPazToday(), 1)}
                    className="h-11 rounded-xl border-[#ece7e2] bg-white text-[#111111]"
                  />
                  {driver.licenseExpiryDate && rentalStartDate && !licenseValid ? (
                    <p className="mt-1 text-xs text-red-600">{t("booking.errors.licenseInvalid")}</p>
                  ) : null}
                </div>
              </div>

              <div>
                <Label htmlFor={`additional-driver-license-${index}`} className="mb-2 block font-semibold text-[#44403c]">
                  {t("booking.additionalDrivers.upload")}
                </Label>
                <input
                  id={`additional-driver-license-${index}`}
                  type="file"
                  accept="image/*,application/pdf"
                  disabled={disabled || uploadingIndex === index}
                  className="hidden"
                  onChange={(e) => handleFileChange(index, e.target.files?.[0])}
                />
                <Label
                  htmlFor={`additional-driver-license-${index}`}
                  className="flex h-28 w-full cursor-pointer items-center justify-center rounded-[1.25rem] border-2 border-dashed border-[#e7dcd5] bg-[#faf8f6] text-center transition-colors hover:border-[#b91c1c]/40 hover:bg-white"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#111111]">
                      {uploadingIndex === index ? t("common.loading") : t("booking.additionalDrivers.upload")}
                    </p>
                    <p className="mt-1 text-xs text-[#78716c]">JPG, PNG, PDF (max 8MB)</p>
                  </div>
                </Label>
              </div>

              {driver.driverLicenseUrl ? (
                <DocumentPreview
                  url={driver.driverLicenseUrl}
                  title={t("booking.additionalDrivers.documentTitle", { number: index + 1 })}
                  openLabel={t("booking.openOriginal")}
                  emptyLabel={t("booking.documentUnavailable")}
                />
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

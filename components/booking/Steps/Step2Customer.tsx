"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  FileBadge2,
  Plane,
  Mail,
  Phone,
  Upload,
  User,
  ClipboardPenLine,
} from "lucide-react";
import { BookingData } from "../BookingWizard";
import { DocumentPreview } from "@/components/shared/DocumentPreview";
import { AdditionalDriversEditor } from "@/components/shared/AdditionalDriversEditor";
import { combinePhoneNumber, PHONE_COUNTRY_CODES } from "@/lib/phone";
import {
  addLaPazDays,
  getLaPazToday,
  getLaPazTodayPlusYears,
  startOfLaPazDay,
} from "@/lib/timezone";
import { isAdditionalDriverAdult, isAdditionalDriverLicenseValid } from "@/lib/additional-drivers";

interface Step2CustomerProps {
  bookingData: BookingData;
  updateBookingData: (updates: Partial<BookingData>) => void;
  onNext: () => void;
  onPrev: () => void;
  disabled: boolean;
}

const LICENSE_EXPIRY_FROM_YEAR = 2026;
const LICENSE_EXPIRY_TO_YEAR = 2041;

export function Step2Customer({ bookingData, updateBookingData, onNext, onPrev, disabled }: Step2CustomerProps) {
  const t = useTranslations();
  const [isUploading, setIsUploading] = useState(false);
  const updatePhone = (countryCode: string, localNumber: string) => {
    updateBookingData({
      customerPhoneCountryCode: countryCode,
      customerPhoneLocalNumber: localNumber,
      customerPhone: combinePhoneNumber(countryCode, localNumber),
    });
  };
  const isAtLeast21 = (() => {
    if (!bookingData.birthDate) return false;
    const threshold = getLaPazTodayPlusYears(-21);
    return bookingData.birthDate <= threshold;
  })();
  const isLicenseValid = (() => {
    if (!bookingData.licenseExpiryDate || !bookingData.startDate) return false;
    const start = startOfLaPazDay(bookingData.startDate);
    const expiry = startOfLaPazDay(bookingData.licenseExpiryDate);
    return expiry > start;
  })();

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("driverLicense", file);

      const response = await fetch("/api/upload/license", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        updateBookingData({ driverLicenseUrl: result.driverLicenseUrl });
        toast.success(t("common.success"));
      } else {
        toast.error(result.error || t("booking.errors.uploadFailed"));
      }
    } catch (error) {
      toast.error(t("booking.errors.uploadFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        toast.error(t("booking.errors.fileType"));
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error(t("booking.errors.fileSize"));
        return;
      }
      handleFileUpload(file);
    }
  };

  const canContinue = bookingData.customerName &&
                     bookingData.customerEmail &&
                     bookingData.customerPhoneLocalNumber.trim() &&
                     bookingData.birthDate &&
                     bookingData.driverLicenseNumber &&
                     bookingData.licenseExpiryDate &&
                     isAtLeast21 &&
                     isLicenseValid &&
                     bookingData.driverLicenseUrl &&
                     bookingData.additionalDrivers.every((driver) =>
                       driver.fullName.trim() &&
                       driver.birthDate &&
                       driver.driverLicenseNumber.trim() &&
                       driver.licenseExpiryDate &&
                       driver.driverLicenseUrl &&
                       isAdditionalDriverAdult(driver.birthDate) &&
                       isAdditionalDriverLicenseValid(
                         driver.licenseExpiryDate,
                         bookingData.startDate ? startOfLaPazDay(bookingData.startDate) : null
                       )
                     ) &&
                     bookingData.privacyConsentAccepted;

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-[#efe7df] bg-[#faf8f6] p-6 shadow-[0_24px_60px_-46px_rgba(0,0,0,0.16)]">
        <h2 className="mb-4 text-xl font-semibold text-[#111111]">{t("booking.customerName")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customerName" className="mb-2 flex items-center gap-2 font-semibold text-[#44403c]">
              <User className="h-4 w-4 text-[#FF912C]" />
              {t("booking.customerName")}
            </Label>
            <Input
              id="customerName"
              value={bookingData.customerName}
              onChange={(e) => updateBookingData({ customerName: e.target.value })}
              disabled={disabled}
              required
              className="h-11 rounded-xl border-[#ece7e2] bg-white text-[#111111]"
            />
          </div>

          <div>
            <Label htmlFor="customerEmail" className="mb-2 flex items-center gap-2 font-semibold text-[#44403c]">
              <Mail className="h-4 w-4 text-[#FF912C]" />
              {t("booking.customerEmail")}
            </Label>
            <Input
              id="customerEmail"
              type="email"
              value={bookingData.customerEmail}
              onChange={(e) => updateBookingData({ customerEmail: e.target.value })}
              disabled={disabled}
              required
              className="h-11 rounded-xl border-[#ece7e2] bg-white text-[#111111]"
            />
          </div>

          <div>
            <Label htmlFor="customerPhone" className="mb-2 flex items-center gap-2 font-semibold text-[#44403c]">
              <Phone className="h-4 w-4 text-[#FF912C]" />
              {t("booking.customerPhone")}
            </Label>
            <div className="grid grid-cols-[180px_minmax(0,1fr)] gap-2">
              <Select
                value={bookingData.customerPhoneCountryCode}
                onValueChange={(value) => updatePhone(value, bookingData.customerPhoneLocalNumber)}
                disabled={disabled}
              >
                <SelectTrigger className="h-11 w-full rounded-xl border-[#ece7e2] bg-white text-[#111111]">
                  <SelectValue placeholder="Code" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {PHONE_COUNTRY_CODES.map((country) => (
                    <SelectItem key={country.label} value={country.code}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="customerPhone"
                type="tel"
                value={bookingData.customerPhoneLocalNumber}
                onChange={(e) => updatePhone(bookingData.customerPhoneCountryCode, e.target.value)}
                disabled={disabled}
                required
                className="h-11 rounded-xl border-[#ece7e2] bg-white text-[#111111]"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="flightNumber" className="mb-2 flex items-center gap-2 font-semibold text-[#44403c]">
              <Plane className="h-4 w-4 text-[#FF912C]" />
              {t("booking.flightNumber")}
            </Label>
            <Input
              id="flightNumber"
              value={bookingData.flightNumber}
              onChange={(e) => updateBookingData({ flightNumber: e.target.value })}
              disabled={disabled}
              className="h-11 rounded-xl border-[#ece7e2] bg-white text-[#111111]"
            />
          </div>

          <div>
            <Label htmlFor="driverLicenseNumber" className="mb-2 flex items-center gap-2 font-semibold text-[#44403c]">
              <FileBadge2 className="h-4 w-4 text-[#FF912C]" />
              {t("booking.driverLicenseNumber")}
            </Label>
            <Input
              id="driverLicenseNumber"
              value={bookingData.driverLicenseNumber}
              onChange={(e) => updateBookingData({ driverLicenseNumber: e.target.value })}
              disabled={disabled}
              required
              className="h-11 rounded-xl border-[#ece7e2] bg-white text-[#111111]"
            />
          </div>

          <div>
            <Label htmlFor="birthDate" className="mb-2 flex items-center gap-2 font-semibold text-[#44403c]">
              <CalendarDays className="h-4 w-4 text-[#FF912C]" />
              {t("booking.birthDate")}
            </Label>
            <DatePicker
              id="birthDate"
              value={bookingData.birthDate}
              onChange={(date) => updateBookingData({ birthDate: date })}
              disabled={disabled}
              placeholder={t("booking.birthDate")}
              maxDate={getLaPazTodayPlusYears(-21)}
              className="h-11 rounded-xl border-[#ece7e2] bg-white text-[#111111]"
            />
            {bookingData.birthDate && !isAtLeast21 && (
              <p className="text-xs text-[#FF912C] mt-1">{t("booking.errors.ageMinimum")}</p>
            )}
          </div>

          <div>
            <Label htmlFor="licenseExpiryDate" className="mb-2 flex items-center gap-2 font-semibold text-[#44403c]">
              <CalendarDays className="h-4 w-4 text-[#FF912C]" />
              {t("booking.licenseExpiryDate")}
            </Label>
            <DatePicker
              id="licenseExpiryDate"
              value={bookingData.licenseExpiryDate}
              onChange={(date) => updateBookingData({ licenseExpiryDate: date })}
              disabled={disabled}
              placeholder={t("booking.licenseExpiryDate")}
              fromYear={LICENSE_EXPIRY_FROM_YEAR}
              toYear={LICENSE_EXPIRY_TO_YEAR}
              minDate={addLaPazDays(getLaPazToday(), 1)}
              className="h-11 rounded-xl border-[#ece7e2] bg-white text-[#111111]"
            />
            {bookingData.licenseExpiryDate && !isLicenseValid && (
              <p className="text-xs text-[#FF912C] mt-1">{t("booking.errors.licenseInvalid")}</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-[#111111]">{t("booking.driverLicense")}</h3>
        <Card className="rounded-[1.75rem] border-[#efe7df] bg-white shadow-[0_24px_60px_-46px_rgba(0,0,0,0.16)]">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="driverLicense">{t("booking.driverLicense")}</Label>
                <div className="mt-2">
                  <input
                    id="driverLicense"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    disabled={disabled || isUploading}
                    className="hidden"
                  />
                  <Label
                    htmlFor="driverLicense"
                    className="flex h-32 w-full cursor-pointer items-center justify-center rounded-[1.25rem] border-2 border-dashed border-[#e7dcd5] bg-[#faf8f6] transition-colors hover:border-[#FF912C]/40 hover:bg-white"
                  >
                    <div className="text-center">
                      <Upload className="mx-auto mb-2 h-8 w-8 text-[#FF912C]" />
                      <p className="text-sm font-semibold text-[#111111]">
                        {isUploading ? t("common.loading") : t("booking.driverLicense")}
                      </p>
                      <p className="mt-1 text-xs text-[#78716c]">
                        JPG, PNG, PDF (max 8MB)
                      </p>
                    </div>
                  </Label>
                </div>
              </div>

              {bookingData.driverLicenseUrl && (
                <div className="space-y-3">
                  <div className="rounded-[1rem] border border-[#bad8a7] bg-[#eef9e7] p-3">
                    <p className="text-sm font-semibold text-[#2e6b19]">
                      ✓ {t("booking.driverLicense")} {t("common.success").toLowerCase()}
                    </p>
                  </div>
                  <DocumentPreview
                    url={bookingData.driverLicenseUrl}
                    title={t("booking.driverLicense")}
                    openLabel={t("booking.openOriginal")}
                    emptyLabel={t("booking.documentUnavailable")}
                  />
                </div>
              )}

              <div className="rounded-[1rem] border border-[#efe7df] bg-[#faf8f6] p-4">
                <p className="text-sm font-semibold text-[#111111]">{t("booking.termsOfService")}</p>
                <p className="mt-2 text-sm text-[#57534e]">{t("booking.identificationClause")}</p>
                <p className="mt-2 text-xs text-[#78716c]">{t("booking.gdprNotice")}</p>
                <p className="mt-3 text-sm font-semibold text-[#111111]">{t("booking.privacyPolicy")}</p>
                <p className="mt-2 text-xs text-[#78716c]">{t("booking.privacyDeletionNotice")}</p>
                <div className="mt-4 flex items-start space-x-2">
                  <Checkbox
                    id="privacyConsent"
                    checked={bookingData.privacyConsentAccepted}
                    onCheckedChange={(checked) => updateBookingData({ privacyConsentAccepted: checked as boolean })}
                    disabled={disabled}
                  />
                  <label htmlFor="privacyConsent" className="text-sm text-[#111111]">
                    {t("booking.privacyConsentCheckbox")}
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AdditionalDriversEditor
        drivers={bookingData.additionalDrivers}
        onChange={(additionalDrivers) => updateBookingData({ additionalDrivers })}
        rentalStartDate={bookingData.startDate}
        disabled={disabled}
      />

      <div className="rounded-[1.75rem] border border-[#efe7df] bg-[#faf8f6] p-6 shadow-[0_24px_60px_-46px_rgba(0,0,0,0.16)]">
        <Label htmlFor="notes" className="mb-2 flex items-center gap-2 font-semibold text-[#44403c]">
          <ClipboardPenLine className="h-4 w-4 text-[#FF912C]" />
          {t("booking.notes")}
        </Label>
        <Textarea
          id="notes"
          value={bookingData.notes}
          onChange={(e) => updateBookingData({ notes: e.target.value })}
          disabled={disabled}
          rows={3}
          className="rounded-xl border-[#ece7e2] bg-white text-[#111111]"
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev} className="h-12 rounded-full border-[#e7dcd5] bg-white text-[#111111] hover:bg-[#faf8f6]">
          <ArrowLeft className="h-4 w-4" />
          {t("booking.back")}
        </Button>
        <Button onClick={onNext} disabled={!canContinue || disabled} className="h-12 rounded-full bg-[#111111] px-6 font-semibold text-white hover:bg-[#292524]">
          <ArrowRight className="h-4 w-4" />
          {t("booking.continue")}
        </Button>
      </div>
    </div>
  );
}

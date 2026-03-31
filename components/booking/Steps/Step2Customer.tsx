"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { combinePhoneNumber, PHONE_COUNTRY_CODES } from "@/lib/phone";

interface Step2CustomerProps {
  bookingData: BookingData;
  updateBookingData: (updates: Partial<BookingData>) => void;
  onNext: () => void;
  onPrev: () => void;
  disabled: boolean;
}

export function Step2Customer({ bookingData, updateBookingData, onNext, onPrev, disabled }: Step2CustomerProps) {
  const t = useTranslations();
  const [isUploading, setIsUploading] = useState(false);
  const toDateInputValue = (date: Date | null) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const fromDateInputValue = (value: string) => (value ? new Date(`${value}T12:00:00`) : null);
  const updatePhone = (countryCode: string, localNumber: string) => {
    updateBookingData({
      customerPhoneCountryCode: countryCode,
      customerPhoneLocalNumber: localNumber,
      customerPhone: combinePhoneNumber(countryCode, localNumber),
    });
  };
  const isAtLeast21 = (() => {
    if (!bookingData.birthDate) return false;
    const today = new Date();
    const threshold = new Date(today.getFullYear() - 21, today.getMonth(), today.getDate());
    return bookingData.birthDate <= threshold;
  })();
  const isLicenseValid = (() => {
    if (!bookingData.licenseExpiryDate || !bookingData.startDate) return false;
    const start = new Date(bookingData.startDate);
    start.setHours(0, 0, 0, 0);
    const expiry = new Date(bookingData.licenseExpiryDate);
    expiry.setHours(0, 0, 0, 0);
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
                     bookingData.privacyConsentAccepted;

  return (
    <div className="space-y-6">
      <div className="public-glass-card rounded-[1.75rem] p-6">
        <h2 className="mb-4 text-xl font-black text-[hsl(var(--foreground))]">{t("booking.customerName")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customerName" className="mb-2 flex items-center gap-2 font-bold text-[hsl(var(--accent-foreground))]">
              <User className="h-4 w-4 text-[hsl(var(--primary))]" />
              {t("booking.customerName")}
            </Label>
            <Input
              id="customerName"
              value={bookingData.customerName}
              onChange={(e) => updateBookingData({ customerName: e.target.value })}
              disabled={disabled}
              required
              className="h-11 rounded-xl border-white/60 bg-white/88 text-[hsl(var(--foreground))] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 ring-white/55"
            />
          </div>

          <div>
            <Label htmlFor="customerEmail" className="mb-2 flex items-center gap-2 font-bold text-[hsl(var(--accent-foreground))]">
              <Mail className="h-4 w-4 text-[hsl(var(--primary))]" />
              {t("booking.customerEmail")}
            </Label>
            <Input
              id="customerEmail"
              type="email"
              value={bookingData.customerEmail}
              onChange={(e) => updateBookingData({ customerEmail: e.target.value })}
              disabled={disabled}
              required
              className="h-11 rounded-xl border-white/60 bg-white/88 text-[hsl(var(--foreground))] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 ring-white/55"
            />
          </div>

          <div>
            <Label htmlFor="customerPhone" className="mb-2 flex items-center gap-2 font-bold text-[hsl(var(--accent-foreground))]">
              <Phone className="h-4 w-4 text-[hsl(var(--primary))]" />
              {t("booking.customerPhone")}
            </Label>
            <div className="grid grid-cols-[180px_minmax(0,1fr)] gap-2">
              <Select
                value={bookingData.customerPhoneCountryCode}
                onValueChange={(value) => updatePhone(value, bookingData.customerPhoneLocalNumber)}
                disabled={disabled}
              >
                <SelectTrigger className="h-11 w-full rounded-xl border-white/60 bg-white/88 text-[hsl(var(--foreground))] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 ring-white/55">
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
                className="h-11 rounded-xl border-white/60 bg-white/88 text-[hsl(var(--foreground))] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 ring-white/55"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="flightNumber" className="mb-2 flex items-center gap-2 font-bold text-[hsl(var(--accent-foreground))]">
              <Plane className="h-4 w-4 text-[hsl(var(--primary))]" />
              {t("booking.flightNumber")}
            </Label>
            <Input
              id="flightNumber"
              value={bookingData.flightNumber}
              onChange={(e) => updateBookingData({ flightNumber: e.target.value })}
              disabled={disabled}
              className="h-11 rounded-xl border-white/60 bg-white/88 text-[hsl(var(--foreground))] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 ring-white/55"
            />
          </div>

          <div>
            <Label htmlFor="driverLicenseNumber" className="mb-2 flex items-center gap-2 font-bold text-[hsl(var(--accent-foreground))]">
              <FileBadge2 className="h-4 w-4 text-[hsl(var(--primary))]" />
              {t("booking.driverLicenseNumber")}
            </Label>
            <Input
              id="driverLicenseNumber"
              value={bookingData.driverLicenseNumber}
              onChange={(e) => updateBookingData({ driverLicenseNumber: e.target.value })}
              disabled={disabled}
              required
              className="h-11 rounded-xl border-white/60 bg-white/88 text-[hsl(var(--foreground))] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 ring-white/55"
            />
          </div>

          <div>
            <Label htmlFor="birthDate" className="mb-2 flex items-center gap-2 font-bold text-[hsl(var(--accent-foreground))]">
              <CalendarDays className="h-4 w-4 text-[hsl(var(--primary))]" />
              {t("booking.birthDate")}
            </Label>
            <Input
              id="birthDate"
              type="date"
              value={toDateInputValue(bookingData.birthDate)}
              onChange={(e) => updateBookingData({ birthDate: fromDateInputValue(e.target.value) })}
              disabled={disabled}
              max={(() => {
                const now = new Date();
                const minAdultDate = new Date(now.getFullYear() - 21, now.getMonth(), now.getDate());
                return toDateInputValue(minAdultDate);
              })()}
              className="h-11 rounded-xl border-white/60 bg-white/88 text-[hsl(var(--foreground))] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 ring-white/55"
            />
            {bookingData.birthDate && !isAtLeast21 && (
              <p className="text-xs text-red-600 mt-1">{t("booking.errors.ageMinimum")}</p>
            )}
          </div>

          <div>
            <Label htmlFor="licenseExpiryDate" className="mb-2 flex items-center gap-2 font-bold text-[hsl(var(--accent-foreground))]">
              <CalendarDays className="h-4 w-4 text-[hsl(var(--primary))]" />
              {t("booking.licenseExpiryDate")}
            </Label>
            <Input
              id="licenseExpiryDate"
              type="date"
              value={toDateInputValue(bookingData.licenseExpiryDate)}
              onChange={(e) => updateBookingData({ licenseExpiryDate: fromDateInputValue(e.target.value) })}
              disabled={disabled}
              min={(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                return toDateInputValue(tomorrow);
              })()}
              className="h-11 rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--accent)/0.35)] text-[hsl(var(--foreground))]"
            />
            {bookingData.licenseExpiryDate && !isLicenseValid && (
              <p className="text-xs text-red-600 mt-1">{t("booking.errors.licenseInvalid")}</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-black text-[hsl(var(--foreground))]">{t("booking.driverLicense")}</h3>
        <Card className="public-glass-card rounded-[1.75rem]">
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
                    className="flex h-32 w-full cursor-pointer items-center justify-center rounded-[1.25rem] border-2 border-dashed border-[rgba(15,39,64,0.14)] bg-[rgba(248,250,252,0.92)] transition-colors hover:border-[rgba(19,120,152,0.45)] hover:bg-white"
                  >
                    <div className="text-center">
                      <Upload className="mx-auto mb-2 h-8 w-8 text-[rgb(19,120,152)]" />
                      <p className="text-sm font-semibold text-[rgb(15,39,64)]">
                        {isUploading ? t("common.loading") : t("booking.driverLicense")}
                      </p>
                      <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                        JPG, PNG, PDF (max 8MB)
                      </p>
                    </div>
                  </Label>
                </div>
              </div>

              {bookingData.driverLicenseUrl && (
                <div className="space-y-3">
                  <div className="rounded-[1rem] border border-emerald-200 bg-emerald-50/90 p-3">
                    <p className="text-sm font-semibold text-emerald-700">
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

              <div className="public-glass-card rounded-[1rem] p-4">
                <p className="text-sm font-bold text-[hsl(var(--foreground))]">{t("booking.termsOfService")}</p>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{t("booking.identificationClause")}</p>
                <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">{t("booking.gdprNotice")}</p>
                <p className="mt-3 text-sm font-bold text-[hsl(var(--foreground))]">{t("booking.privacyPolicy")}</p>
                <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">{t("booking.privacyDeletionNotice")}</p>
                <div className="mt-4 flex items-start space-x-2">
                  <Checkbox
                    id="privacyConsent"
                    checked={bookingData.privacyConsentAccepted}
                    onCheckedChange={(checked) => updateBookingData({ privacyConsentAccepted: checked as boolean })}
                    disabled={disabled}
                  />
                  <label htmlFor="privacyConsent" className="text-sm text-[hsl(var(--foreground))]">
                    {t("booking.privacyConsentCheckbox")}
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="public-glass-card rounded-[1.75rem] p-6">
        <Label htmlFor="notes" className="mb-2 flex items-center gap-2 font-bold text-[hsl(var(--accent-foreground))]">
          <ClipboardPenLine className="h-4 w-4 text-[hsl(var(--primary))]" />
          {t("booking.notes")}
        </Label>
        <Textarea
          id="notes"
          value={bookingData.notes}
          onChange={(e) => updateBookingData({ notes: e.target.value })}
          disabled={disabled}
          rows={3}
          className="rounded-xl border-white/60 bg-white/88 text-[hsl(var(--foreground))] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 ring-white/55"
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev} className="public-outline-button h-12 rounded-full">
          <ArrowLeft className="h-4 w-4" />
          {t("booking.back")}
        </Button>
        <Button onClick={onNext} disabled={!canContinue || disabled} className="public-primary-button h-12 rounded-full px-6 font-extrabold uppercase tracking-[0.08em]">
          <ArrowRight className="h-4 w-4" />
          {t("booking.continue")}
        </Button>
      </div>
    </div>
  );
}

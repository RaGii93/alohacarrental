"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { uploadDriverLicenseAction } from "@/actions/booking";
import { BookingData } from "../BookingWizard";
import { DatePicker } from "@/components/ui/date-picker";

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

      const result = await uploadDriverLicenseAction(formData);
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
                     bookingData.customerPhone &&
                     bookingData.birthDate &&
                     bookingData.driverLicenseNumber &&
                     bookingData.licenseExpiryDate &&
                     isAtLeast21 &&
                     isLicenseValid &&
                     bookingData.driverLicenseUrl;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">{t("booking.customerName")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customerName">{t("booking.customerName")}</Label>
            <Input
              id="customerName"
              value={bookingData.customerName}
              onChange={(e) => updateBookingData({ customerName: e.target.value })}
              disabled={disabled}
              required
            />
          </div>

          <div>
            <Label htmlFor="customerEmail">{t("booking.customerEmail")}</Label>
            <Input
              id="customerEmail"
              type="email"
              value={bookingData.customerEmail}
              onChange={(e) => updateBookingData({ customerEmail: e.target.value })}
              disabled={disabled}
              required
            />
          </div>

          <div>
            <Label htmlFor="customerPhone">{t("booking.customerPhone")}</Label>
            <Input
              id="customerPhone"
              value={bookingData.customerPhone}
              onChange={(e) => updateBookingData({ customerPhone: e.target.value })}
              disabled={disabled}
              required
            />
          </div>

          <div>
            <Label htmlFor="driverLicenseNumber">{t("booking.driverLicenseNumber")}</Label>
            <Input
              id="driverLicenseNumber"
              value={bookingData.driverLicenseNumber}
              onChange={(e) => updateBookingData({ driverLicenseNumber: e.target.value })}
              disabled={disabled}
              required
            />
          </div>

          <div>
            <Label htmlFor="birthDate">{t("booking.birthDate")}</Label>
            <DatePicker
              id="birthDate"
              value={bookingData.birthDate}
              onChange={(date) => updateBookingData({ birthDate: date })}
              placeholder={t("booking.birthDate")}
              disabled={disabled}
              fromYear={new Date().getFullYear() - 100}
              toYear={new Date().getFullYear() - 21}
              disabledDate={(date) => {
                const now = new Date();
                const minAdultDate = new Date(now.getFullYear() - 21, now.getMonth(), now.getDate());
                return date > minAdultDate;
              }}
            />
            {bookingData.birthDate && !isAtLeast21 && (
              <p className="text-xs text-red-600 mt-1">{t("booking.errors.ageMinimum")}</p>
            )}
          </div>

          <div>
            <Label htmlFor="licenseExpiryDate">{t("booking.licenseExpiryDate")}</Label>
            <DatePicker
              id="licenseExpiryDate"
              value={bookingData.licenseExpiryDate}
              onChange={(date) => updateBookingData({ licenseExpiryDate: date })}
              placeholder={t("booking.licenseExpiryDate")}
              disabled={disabled}
              fromYear={new Date().getFullYear()}
              toYear={new Date().getFullYear() + 20}
              disabledDate={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date <= today;
              }}
            />
            {bookingData.licenseExpiryDate && !isLicenseValid && (
              <p className="text-xs text-red-600 mt-1">{t("booking.errors.licenseInvalid")}</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">{t("booking.driverLicense")}</h3>
        <Card>
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
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors"
                  >
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {isUploading ? t("common.loading") : t("booking.driverLicense")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG, PDF (max 8MB)
                      </p>
                    </div>
                  </Label>
                </div>
              </div>

              {bookingData.driverLicenseUrl && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ {t("booking.driverLicense")} {t("common.success").toLowerCase()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Label htmlFor="notes">{t("booking.notes")}</Label>
        <Textarea
          id="notes"
          value={bookingData.notes}
          onChange={(e) => updateBookingData({ notes: e.target.value })}
          disabled={disabled}
          rows={3}
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev}>
          {t("booking.back")}
        </Button>
        <Button onClick={onNext} disabled={!canContinue || disabled}>
          {t("booking.continue")}
        </Button>
      </div>
    </div>
  );
}

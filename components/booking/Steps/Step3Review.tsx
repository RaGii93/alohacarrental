"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  ExternalLink,
  FileText,
  HandCoins,
  Mail,
  MapPin,
  Plane,
  Phone,
  Receipt,
  User,
} from "lucide-react";
import { AvailabilityResult } from "@/actions/availability";
import { createCategoryBookingAction } from "@/actions/booking";
import { calculateDays, evaluateBookingRules, formatCurrency } from "@/lib/pricing";
import { BookingData } from "../BookingWizard";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { combinePhoneNumber } from "@/lib/phone";
import type { BookingRuleSettings } from "@/lib/settings";

interface Step3ReviewProps {
  bookingData: BookingData;
  updateBookingData: (updates: Partial<BookingData>) => void;
  locations: { id: string; name: string; code?: string | null; address?: string | null }[];
  extras: { id: string; name: string; pricingType: "DAILY" | "FLAT"; amount: number; description?: string | null }[];
  locale: string;
  onPrev: () => void;
  disabled: boolean;
  availability: AvailabilityResult[];
  taxPercentage: number;
  vehicleRatesIncludeTax: boolean;
  termsPdfUrl: string;
  bookingSource?: "public" | "admin";
  bookingRuleSettings: BookingRuleSettings;
}

export function Step3Review({
  bookingData,
  updateBookingData,
  locations,
  extras,
  locale,
  onPrev,
  disabled,
  availability,
  taxPercentage,
  vehicleRatesIncludeTax,
  termsPdfUrl,
  bookingSource = "public",
  bookingRuleSettings,
}: Step3ReviewProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mergeDateAndTime = (date: Date | null, time: string): Date | null => {
    if (!date) return null;
    const [hours, minutes] = time.split(":").map((v) => Number(v));
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    const next = new Date(date);
    next.setHours(hours, minutes, 0, 0);
    return next;
  };

  const pickupDateTime = mergeDateAndTime(bookingData.startDate, bookingData.pickupTime);
  const dropoffDateTime = mergeDateAndTime(bookingData.endDate, bookingData.dropoffTime);

  const handleSubmit = async () => {
    if (!bookingData.privacyConsentAccepted) {
      toast.error(t("booking.errors.privacyConsentRequired"));
      return;
    }
    if (!bookingData.termsAccepted) {
      toast.error(t("booking.errors.termsNotAccepted"));
      return;
    }
    if (!bookingData.birthDate || !bookingData.licenseExpiryDate) {
      toast.error(t("booking.errors.birthLicenseRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      const customerPhone = combinePhoneNumber(
        bookingData.customerPhoneCountryCode,
        bookingData.customerPhoneLocalNumber
      );
      formData.append("categoryId", bookingData.categoryId!);
      formData.append("customerName", bookingData.customerName);
      formData.append("customerEmail", bookingData.customerEmail);
      formData.append("customerPhone", customerPhone);
      formData.append("flightNumber", bookingData.flightNumber);
      formData.append("birthDate", bookingData.birthDate.toISOString());
      formData.append("driverLicenseNumber", bookingData.driverLicenseNumber);
      formData.append("licenseExpiryDate", bookingData.licenseExpiryDate.toISOString());
      if (!pickupDateTime || !dropoffDateTime || dropoffDateTime <= pickupDateTime) {
        toast.error(t("booking.errors.endBeforeStart"));
        setIsSubmitting(false);
        return;
      }
      if (pricing?.belowMinimumBlocked) {
        toast.error(t("booking.errors.minimumDurationAdminOnly", { days: bookingRuleSettings.minimumRentalDays }));
        setIsSubmitting(false);
        return;
      }
      if (pricing?.lastMinuteBlocked) {
        toast.error(t("booking.errors.lastMinuteAdminOnly", { hours: bookingRuleSettings.lastMinuteBookingThresholdHours }));
        setIsSubmitting(false);
        return;
      }
      formData.append("startDate", pickupDateTime.toISOString());
      formData.append("endDate", dropoffDateTime.toISOString());
      formData.append("pickupLocationId", bookingData.pickupLocationId);
      formData.append("dropoffLocationId", bookingData.dropoffLocationId);
      formData.append("driverLicenseUrl", bookingData.driverLicenseUrl);
      formData.append("notes", bookingData.notes);
      formData.append("selectedExtras", JSON.stringify(bookingData.selectedExtras));
      formData.append("privacyConsentAccepted", "true");
      formData.append("termsAccepted", "true");
      formData.append("bookingSource", bookingSource);

      const result = await createCategoryBookingAction(formData, locale);
      if (result.success) {
        toast.success(t("booking.success.title"));
        router.push(result.redirectUrl!);
      } else {
        toast.error(result.error || t("common.error"));
      }
    } catch (error) {
      toast.error(t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const days = pickupDateTime && dropoffDateTime ? calculateDays(pickupDateTime, dropoffDateTime) : 1;
  const selectedCategory = availability.find(cat => cat.categoryId === bookingData.categoryId);
  const categoryRate = selectedCategory?.dailyRate || 2500;
  const baseAmount = categoryRate * days;
  const extrasAmount = bookingData.selectedExtras.reduce((sum, item) => {
    const extra = extras.find((row) => row.id === item.extraId);
    if (!extra) return sum;
    return sum + (extra.pricingType === "DAILY" ? extra.amount * days * item.quantity : extra.amount * item.quantity);
  }, 0);
  const pricing = pickupDateTime && dropoffDateTime && dropoffDateTime > pickupDateTime
    ? evaluateBookingRules({
        startDate: pickupDateTime,
        endDate: dropoffDateTime,
        basePriceCents: categoryRate,
        extrasCents: extrasAmount,
        taxPercentage,
        baseRentalIncludesTax: vehicleRatesIncludeTax,
        bookingSource,
        settings: bookingRuleSettings,
      })
    : null;
  const taxAmount = pricing?.taxAmountCents ?? 0;
  const totalAmount = pricing?.totalAmountCents ?? 0;
  const subtotalBeforeTax = pricing?.subtotalBeforeTaxCents ?? (baseAmount + extrasAmount);
  const pickupLocation = locations.find((location) => location.id === bookingData.pickupLocationId);
  const dropoffLocation = locations.find((location) => location.id === bookingData.dropoffLocationId);
  const pickupLocationMapUrl = pickupLocation?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickupLocation.address)}`
    : null;
  const dropoffLocationMapUrl = dropoffLocation?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dropoffLocation.address)}`
    : null;
  const customerPhone = combinePhoneNumber(bookingData.customerPhoneCountryCode, bookingData.customerPhoneLocalNumber);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-xl font-black text-[hsl(var(--foreground))]">{t("booking.reviewBooking")}</h2>

        <Card className="rounded-[1.75rem] border-[hsl(var(--border))] bg-[linear-gradient(180deg,#ffffff,hsl(var(--accent)/0.22))] shadow-[0_24px_55px_-40px_hsl(var(--primary)/0.25)]">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--foreground))]">{t("booking.summary")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pricing?.belowMinimumBlocked ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {t("booking.errors.minimumDurationAdminOnly", { days: bookingRuleSettings.minimumRentalDays })}
              </div>
            ) : null}
            {pricing?.lastMinuteBlocked ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {t("booking.errors.lastMinuteAdminOnly", { hours: bookingRuleSettings.lastMinuteBookingThresholdHours })}
              </div>
            ) : null}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="mb-2 flex items-center gap-2 font-medium">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  {t("booking.startDate")}
                </h4>
                <p>{pickupDateTime ? formatDateTime(pickupDateTime) : "-"}</p>
              </div>
              <div>
                <h4 className="mb-2 flex items-center gap-2 font-medium">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  {t("booking.endDate")}
                </h4>
                <p>{dropoffDateTime ? formatDateTime(dropoffDateTime) : "-"}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-2 flex items-center gap-2 font-medium">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                {t("booking.category")}
              </h4>
              <p>{selectedCategory?.categoryName || "Unknown"}</p>
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-2 font-medium">
                <Banknote className="h-4 w-4 text-muted-foreground" />
                {t("booking.pricePerDay")}
              </h4>
              <p>{formatCurrency(categoryRate)}</p>
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-2 font-medium">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                {t("booking.baseTotal")}
              </h4>
              <p>{formatCurrency(baseAmount)}</p>
            </div>

            {extrasAmount > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-2 font-medium">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  {t("booking.extras")}
                </h4>
                <div className="space-y-1">
                  {bookingData.selectedExtras.map((item) => {
                    const extra = extras.find((row) => row.id === item.extraId);
                    if (!extra) return null;
                    const lineTotal =
                      extra.pricingType === "DAILY" ? extra.amount * days * item.quantity : extra.amount * item.quantity;
                    return (
                      <p key={item.extraId} className="flex justify-between gap-4">
                        <span>{extra.name} x{item.quantity}</span>
                        <span>{formatCurrency(lineTotal)}</span>
                      </p>
                    );
                  })}
                  <p className="font-medium">{formatCurrency(extrasAmount)}</p>
                </div>
              </div>
            )}

            {pricing?.belowMinimumSurchargeCents ? (
              <div>
                <h4 className="mb-2 flex items-center gap-2 font-medium">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  {t("booking.belowMinimumSurcharge")}
                </h4>
                <p>{formatCurrency(pricing.belowMinimumSurchargeCents)}</p>
              </div>
            ) : null}

            {pricing?.lastMinuteSurchargeCents ? (
              <div>
                <h4 className="mb-2 flex items-center gap-2 font-medium">
                  <Clock3 className="h-4 w-4 text-muted-foreground" />
                  {t("booking.lastMinuteSurcharge")}
                </h4>
                <p>{formatCurrency(pricing.lastMinuteSurchargeCents)}</p>
              </div>
            ) : null}

            <div>
              <h4 className="mb-2 flex items-center gap-2 font-medium">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                {t("booking.subtotal")}
              </h4>
              <p>{formatCurrency(subtotalBeforeTax)}</p>
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-2 font-medium">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {vehicleRatesIncludeTax ? t("booking.taxExtrasOnly", { percentage: taxPercentage }) : t("booking.taxOnBooking", { percentage: taxPercentage })}
              </h4>
              <p>{formatCurrency(taxAmount)}</p>
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-2 font-medium">
                <HandCoins className="h-4 w-4 text-muted-foreground" />
                {t("booking.total")}
              </h4>
              <p className="text-lg font-semibold">{formatCurrency(totalAmount)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[1.75rem] border-[hsl(var(--border))] bg-white/90 shadow-[0_24px_55px_-40px_hsl(var(--primary)/0.25)]">
        <CardHeader>
          <CardTitle className="text-[hsl(var(--foreground))]">{t("booking.customerName")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><strong>{t("booking.customerName")}:</strong> {bookingData.customerName}</p>
          <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><strong>{t("booking.customerEmail")}:</strong> {bookingData.customerEmail}</p>
          <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><strong>{t("booking.customerPhone")}:</strong> {customerPhone}</p>
          <p className="flex items-center gap-2"><Plane className="h-4 w-4 text-muted-foreground" /><strong>{t("booking.flightNumber")}:</strong> {bookingData.flightNumber || "-"}</p>
          <p><strong>{t("booking.birthDate")}:</strong> {bookingData.birthDate ? formatDate(bookingData.birthDate) : "-"}</p>
          <p><strong>{t("booking.driverLicenseNumber")}:</strong> {bookingData.driverLicenseNumber}</p>
          <p><strong>{t("booking.licenseExpiryDate")}:</strong> {bookingData.licenseExpiryDate ? formatDate(bookingData.licenseExpiryDate) : "-"}</p>
          <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /><strong>{t("booking.driverLicense")}:</strong> {t("common.success").toLowerCase()}</p>
        </CardContent>
      </Card>

      {(bookingData.pickupLocationId || bookingData.dropoffLocationId) && (
        <Card className="rounded-[1.75rem] border-[hsl(var(--border))] bg-white/90 shadow-[0_24px_55px_-40px_hsl(var(--primary)/0.25)]">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--foreground))]">{t("booking.pickupLocation")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bookingData.pickupLocationId && (
              <p>
                <strong>{t("booking.pickupLocation")}:</strong> {pickupLocation?.name}
                {pickupLocationMapUrl && (
                  <>
                    {" "}
                    <a href={pickupLocationMapUrl} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--primary))] hover:text-[hsl(var(--accent-foreground))] hover:underline">
                      <span className="inline-flex items-center gap-1">(<MapPin className="h-3.5 w-3.5" /> {t("booking.map")})</span>
                    </a>
                  </>
                )}
              </p>
            )}
            {bookingData.dropoffLocationId && (
              <p>
                <strong>{t("booking.dropoffLocation")}:</strong> {dropoffLocation?.name}
                {dropoffLocationMapUrl && (
                  <>
                    {" "}
                    <a href={dropoffLocationMapUrl} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--primary))] hover:text-[hsl(var(--accent-foreground))] hover:underline">
                      <span className="inline-flex items-center gap-1">(<MapPin className="h-3.5 w-3.5" /> {t("booking.map")})</span>
                    </a>
                  </>
                )}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {extras.length > 0 && (
        <Card className="rounded-[1.75rem] border-[hsl(var(--border))] bg-white/90 shadow-[0_24px_55px_-40px_hsl(var(--primary)/0.25)]">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--foreground))]">{t("booking.extras")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {extras.map((extra) => {
              const line = bookingData.selectedExtras.find((entry) => entry.extraId === extra.id);
              const checked = !!line;
              return (
                <div key={extra.id} className="flex items-center justify-between gap-3 rounded-[1rem] border border-[hsl(var(--border))] bg-[hsl(var(--accent)/0.3)] p-3">
                  <div>
                    <p className="font-medium">{extra.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {extra.pricingType === "DAILY" ? "Daily" : "Flat"} · {formatCurrency(extra.amount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => {
                        const next = [...bookingData.selectedExtras];
                        const idx = next.findIndex((entry) => entry.extraId === extra.id);
                        if (value) {
                          if (idx === -1) next.push({ extraId: extra.id, quantity: 1 });
                        } else if (idx >= 0) {
                          next.splice(idx, 1);
                        }
                        updateBookingData({ selectedExtras: next });
                      }}
                      disabled={disabled}
                    />
                    <input
                      type="number"
                      min={1}
                      value={line?.quantity ?? 1}
                      disabled={!checked || disabled}
                      onChange={(e) => {
                        const qty = Math.max(1, parseInt(e.target.value || "1", 10));
                        updateBookingData({
                          selectedExtras: bookingData.selectedExtras.map((entry) =>
                            entry.extraId === extra.id ? { ...entry, quantity: qty } : entry
                          ),
                        });
                      }}
                      className="h-8 w-16 rounded-md border border-[hsl(var(--border))] bg-white px-2 text-sm text-[hsl(var(--foreground))]"
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {bookingData.notes && (
        <Card className="rounded-[1.75rem] border-[hsl(var(--border))] bg-white/90 shadow-[0_24px_55px_-40px_hsl(var(--primary)/0.25)]">
          <CardHeader>
            <CardTitle className="text-[hsl(var(--foreground))]">{t("booking.notes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{bookingData.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-[1.75rem] border-[hsl(var(--border))] bg-[linear-gradient(180deg,#ffffff,hsl(var(--accent)/0.22))] shadow-[0_24px_55px_-40px_hsl(var(--primary)/0.25)]">
        <CardHeader>
          <CardTitle className="text-[hsl(var(--foreground))]">{t("booking.terms")}</CardTitle>
          <CardDescription className="text-[hsl(var(--muted-foreground))]">
            {t("booking.termsRequired")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-[1rem] border border-[hsl(var(--border))] bg-white/80 p-4">
            <p className="text-sm font-bold text-[hsl(var(--foreground))]">{t("booking.termsOfService")}</p>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{t("booking.identificationClause")}</p>
            <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">{t("booking.gdprNotice")}</p>
            <p className="mt-3 text-sm font-bold text-[hsl(var(--foreground))]">{t("booking.privacyPolicy")}</p>
            <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">{t("booking.privacyDeletionNotice")}</p>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="privacyConsentReview"
              checked={bookingData.privacyConsentAccepted}
              onCheckedChange={(checked) => updateBookingData({ privacyConsentAccepted: checked as boolean })}
              disabled={disabled}
            />
            <label htmlFor="privacyConsentReview" className="text-sm">
              {t("booking.privacyConsentCheckbox")}
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={bookingData.termsAccepted}
              onCheckedChange={(checked) => updateBookingData({ termsAccepted: checked as boolean })}
              disabled={disabled}
            />
            <label htmlFor="terms" className="text-sm">
              {t("booking.acceptTerms")}
            </label>
          </div>

          <Button
            variant="outline"
            onClick={() => window.open(termsPdfUrl, "_blank")}
            className="h-11 w-full rounded-md border-[hsl(var(--border))] bg-white text-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            {t("booking.viewTerms")}
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev} className="h-12 rounded-md border-[hsl(var(--border))] bg-white text-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]">
          <ArrowLeft className="h-4 w-4" />
          {t("booking.back")}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!bookingData.privacyConsentAccepted || !bookingData.termsAccepted || !bookingData.birthDate || !bookingData.licenseExpiryDate || isSubmitting || disabled || !!pricing?.belowMinimumBlocked || !!pricing?.lastMinuteBlocked}
          className="h-12 rounded-md bg-[hsl(var(--primary))] px-6 font-extrabold uppercase tracking-[0.08em] text-[hsl(var(--primary-foreground))] shadow-[0_20px_40px_-20px_hsl(var(--primary)/0.55)] hover:bg-[hsl(var(--primary)/0.9)]"
        >
          <CheckCircle2 className="h-4 w-4" />
          {isSubmitting ? t("common.loading") : t("booking.confirmBooking")}
        </Button>
      </div>
    </div>
  );
}

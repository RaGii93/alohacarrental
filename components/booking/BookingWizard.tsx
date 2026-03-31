"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Gauge, Home, Settings2, Sofa } from "lucide-react";
import { isLicenseActive } from "@/lib/license";
import { getBlobProxyUrl } from "@/lib/blob";
import { calculateDays, evaluateBookingRules, formatCurrency } from "@/lib/pricing";
import { Step1Search } from "./Steps/Step1Search";
import { Step2Customer } from "./Steps/Step2Customer";
import { Step3Review } from "./Steps/Step3Review";
import { AvailabilityResult } from "@/actions/availability";
import type { BookingRuleSettings } from "@/lib/settings";

export interface BookingData {
  startDate: Date | null;
  endDate: Date | null;
  pickupTime: string;
  dropoffTime: string;
  categoryId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhoneCountryCode: string;
  customerPhoneLocalNumber: string;
  customerPhone: string;
  flightNumber: string;
  birthDate: Date | null;
  driverLicenseNumber: string;
  licenseExpiryDate: Date | null;
  pickupLocationId: string;
  dropoffLocationId: string;
  driverLicenseUrl: string;
  notes: string;
  termsAccepted: boolean;
  privacyConsentAccepted: boolean;
  selectedExtras: Array<{ extraId: string; quantity: number }>;
}

export function BookingWizard({
  locale,
  locations,
  extras,
  categories,
  taxPercentage,
  vehicleRatesIncludeTax,
  minimumBookingDays,
  bookingRuleSettings,
  termsPdfUrl,
  bookingSource = "public",
}: {
  locale: string;
  locations: { id: string; name: string; code?: string | null; address?: string | null }[];
  extras: { id: string; name: string; pricingType: "DAILY" | "FLAT"; amount: number; description?: string | null }[];
  categories: Array<{
    id: string;
    name: string;
    imageUrl?: string | null;
    dailyRate: number;
    seats: number;
    transmission: "AUTOMATIC" | "MANUAL";
    features: string[];
  }>;
  taxPercentage: number;
  vehicleRatesIncludeTax: boolean;
  minimumBookingDays: number;
  bookingRuleSettings: BookingRuleSettings;
  termsPdfUrl: string;
  bookingSource?: "public" | "admin";
}) {
  const t = useTranslations();
  const [currentStep, setCurrentStep] = useState(1);
  const [availability, setAvailability] = useState<AvailabilityResult[]>([]);
  const [bookingData, setBookingData] = useState<BookingData>({
    startDate: null,
    endDate: null,
    pickupTime: "10:00",
    dropoffTime: "10:00",
    categoryId: null,
    customerName: "",
    customerEmail: "",
    customerPhoneCountryCode: "+599",
    customerPhoneLocalNumber: "",
    customerPhone: "",
    flightNumber: "",
    birthDate: null,
    driverLicenseNumber: "",
    licenseExpiryDate: null,
    pickupLocationId: "",
    dropoffLocationId: "",
    driverLicenseUrl: "",
    notes: "",
    termsAccepted: false,
    privacyConsentAccepted: false,
    selectedExtras: [],
  });

  const licenseActive = isLicenseActive();

  const updateBookingData = (updates: Partial<BookingData>) => {
    setBookingData((prev) => {
      const next = { ...prev, ...updates };

      if (Object.prototype.hasOwnProperty.call(updates, "startDate")) {
        const nextStartDate = updates.startDate ?? null;
        const currentEndDate = updates.endDate ?? prev.endDate;

        if (nextStartDate && bookingSource === "public" && bookingRuleSettings.belowMinimumRentalAdminOnly) {
          const minimumDropoffDate = new Date(nextStartDate);
          minimumDropoffDate.setHours(0, 0, 0, 0);
          minimumDropoffDate.setDate(minimumDropoffDate.getDate() + minimumBookingDays);

          if (!currentEndDate || currentEndDate < minimumDropoffDate) {
            next.endDate = minimumDropoffDate;
          }
        }
      }

      return next;
    });
  };
  const mergeDateAndTime = (date: Date | null, time: string): Date | null => {
    if (!date) return null;
    const [hours, minutes] = time.split(":").map((v) => Number(v));
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    const next = new Date(date);
    next.setHours(hours, minutes, 0, 0);
    return next;
  };
  const selectedCategory = categories.find((c) => c.id === bookingData.categoryId) || null;
  const pickupDateTime = mergeDateAndTime(bookingData.startDate, bookingData.pickupTime);
  const dropoffDateTime = mergeDateAndTime(bookingData.endDate, bookingData.dropoffTime);
  const days =
    pickupDateTime && dropoffDateTime && dropoffDateTime > pickupDateTime
      ? calculateDays(pickupDateTime, dropoffDateTime)
      : 1;
  const baseAmount = selectedCategory ? selectedCategory.dailyRate * days : 0;
  const extrasAmount = bookingData.selectedExtras.reduce((sum, item) => {
    const extra = extras.find((row) => row.id === item.extraId);
    if (!extra) return sum;
    return sum + (extra.pricingType === "DAILY" ? extra.amount * days * item.quantity : extra.amount * item.quantity);
  }, 0);
  const pricing = pickupDateTime && dropoffDateTime && dropoffDateTime > pickupDateTime
    ? evaluateBookingRules({
        startDate: pickupDateTime,
        endDate: dropoffDateTime,
        basePriceCents: selectedCategory?.dailyRate || 0,
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
  const summaryBlockedMessage = pricing?.belowMinimumBlocked
    ? t("booking.errors.minimumDurationAdminOnly", { days: bookingRuleSettings.minimumRentalDays })
    : pricing?.lastMinuteBlocked
      ? t("booking.errors.lastMinuteAdminOnly", { hours: bookingRuleSettings.lastMinuteBookingThresholdHours })
      : null;

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  const renderStepIndicator = () => (
    <div className="mb-10 flex items-center justify-center gap-3 sm:gap-4">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-black shadow-sm transition-colors ${
            currentStep >= step
              ? "border-transparent bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(229_54%_28%))] text-[hsl(var(--primary-foreground))] shadow-[0_16px_34px_-22px_hsl(var(--primary)/0.42)]"
              : "border-white/60 bg-white/72 text-[hsl(var(--muted-foreground))] ring-1 ring-white/60 backdrop-blur-xl"
          }`}>
            {step}
          </div>
          {step < 4 && (
            <div className={`mx-2 h-1 w-10 rounded-full sm:w-14 ${
              currentStep > step ? "bg-[linear-gradient(90deg,hsl(var(--primary)),hsl(var(--accent-foreground)))]" : "bg-[linear-gradient(90deg,rgba(255,255,255,0.68),hsl(var(--accent)/0.42))]"
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {!licenseActive && (
        <Alert variant="destructive" className="mb-6 rounded-[1.5rem] border-red-200 bg-red-50/95">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t("booking.errors.bookingDisabled")}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden rounded-[2rem] border border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.8),hsl(var(--accent)/0.12)_48%,hsl(192_90%_75%/0.06)_100%)] p-6 shadow-[0_30px_70px_-44px_hsl(var(--foreground)/0.16)] ring-1 ring-white/60 backdrop-blur-xl sm:p-8">
          <div className="mb-6 text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[hsl(var(--primary))]">{t("nav.booking")}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[hsl(var(--foreground))] sm:text-4xl">{t("booking.title")}</h1>
          </div>

          {renderStepIndicator()}

          {currentStep === 1 && (
            <Step1Search
              bookingData={bookingData}
              updateBookingData={updateBookingData}
              onNext={nextStep}
              disabled={!licenseActive}
              setAvailability={setAvailability}
              availability={availability}
              locations={locations}
              minimumBookingDays={minimumBookingDays}
              bookingSource={bookingSource}
              bookingRuleSettings={bookingRuleSettings}
            />
          )}

          {currentStep === 2 && (
            <Step2Customer
              bookingData={bookingData}
              updateBookingData={updateBookingData}
              onNext={nextStep}
              onPrev={prevStep}
              disabled={!licenseActive}
            />
          )}

          {currentStep === 3 && (
            <Step3Review
              bookingData={bookingData}
              updateBookingData={updateBookingData}
              locations={locations}
              extras={extras}
              locale={locale}
              onPrev={prevStep}
              disabled={!licenseActive}
              availability={availability}
              taxPercentage={taxPercentage}
              vehicleRatesIncludeTax={vehicleRatesIncludeTax}
              termsPdfUrl={termsPdfUrl}
              bookingSource={bookingSource}
              bookingRuleSettings={bookingRuleSettings}
            />
          )}

          {currentStep === 4 && (
            <div className="text-center py-8">
              <h2 className="mb-4 text-2xl font-black text-[hsl(var(--foreground))]">{t("booking.bookingRequestReceived")}</h2>
              <p className="mb-6 text-[hsl(var(--muted-foreground))]">{t("booking.nextSteps")}</p>
              <Button
                onClick={() => window.location.href = `/${locale}`}
                className="h-12 rounded-full bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(229_54%_28%))] px-6 font-extrabold uppercase tracking-[0.08em] text-[hsl(var(--primary-foreground))] shadow-[0_20px_40px_-22px_hsl(var(--primary)/0.42)] hover:opacity-95"
              >
                <Home className="h-4 w-4" />
                {t("nav.home")}
              </Button>
            </div>
          )}
        </Card>

        <Card className="h-fit rounded-[2rem] border border-[hsl(var(--border)/0.7)] bg-white p-5 text-[hsl(var(--foreground))] shadow-[0_30px_70px_-50px_hsl(var(--foreground)/0.12)] lg:sticky lg:top-24">
          <h3 className="mb-3 text-lg font-black tracking-[0.04em] text-[hsl(var(--foreground))]">{t("booking.summary")}</h3>
          {selectedCategory?.imageUrl ? (
            <img
              src={selectedCategory.imageUrl.startsWith("/") ? selectedCategory.imageUrl : getBlobProxyUrl(selectedCategory.imageUrl) || selectedCategory.imageUrl}
              alt={selectedCategory.name}
              className="mb-3 h-40 w-full rounded-[1.25rem] border border-[hsl(var(--border))] bg-white object-cover"
            />
          ) : (
            <div className="mb-3 flex h-40 items-center justify-center rounded-[1.25rem] border border-[hsl(var(--border)/0.65)] bg-[hsl(var(--accent)/0.14)] text-sm text-[hsl(var(--muted-foreground))]">
              {t("booking.selectCategory")}
            </div>
          )}
          <div className="space-y-2 text-sm">
            <p className="font-bold text-[hsl(var(--foreground))]">{selectedCategory?.name || "-"}</p>
            {summaryBlockedMessage ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                {summaryBlockedMessage}
              </div>
            ) : null}
            {selectedCategory ? (
              <div className="grid gap-2">
                <div className="flex items-center gap-2 rounded-xl bg-[hsl(var(--accent)/0.2)] px-3 py-2 text-[hsl(var(--accent-foreground))]">
                  <Sofa className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                  <span>{selectedCategory.seats} seats</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-[hsl(var(--accent)/0.2)] px-3 py-2 text-[hsl(var(--accent-foreground))]">
                  <Settings2 className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                  <span>{selectedCategory.transmission === "MANUAL" ? "Manual" : "Automatic"}</span>
                </div>
                {selectedCategory.features.slice(0, 4).map((feature) => (
                  <div key={feature} className="flex items-center gap-2 rounded-xl bg-[hsl(var(--accent)/0.2)] px-3 py-2 text-[hsl(var(--accent-foreground))]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                    <span>{feature}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 rounded-xl bg-[hsl(var(--accent)/0.2)] px-3 py-2 text-[hsl(var(--accent-foreground))]">
                  <Gauge className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                  <span>Standard performance</span>
                </div>
              </div>
            ) : (
              <p className="text-[hsl(var(--muted-foreground))]">-</p>
            )}
            <div className="mt-4 space-y-2 rounded-[1.25rem] border border-[hsl(var(--border)/0.65)] bg-[hsl(var(--accent)/0.08)] p-4">
              <div className="flex justify-between text-[hsl(var(--muted-foreground))]"><span>{t("booking.pricePerDay")}</span><span className="font-semibold text-[hsl(var(--foreground))]">{selectedCategory ? formatCurrency(selectedCategory.dailyRate) : "-"}</span></div>
              <div className="flex justify-between text-[hsl(var(--muted-foreground))]"><span>{t("booking.days")}</span><span className="font-semibold text-[hsl(var(--foreground))]">{days}</span></div>
              <div className="flex justify-between text-[hsl(var(--muted-foreground))]"><span>{t("booking.baseTotal")}</span><span className="font-semibold text-[hsl(var(--foreground))]">{formatCurrency(baseAmount)}</span></div>
              {pricing?.belowMinimumSurchargeCents ? (
                <div className="flex justify-between text-[hsl(var(--muted-foreground))]"><span>{t("booking.belowMinimumSurcharge")}</span><span className="font-semibold text-[hsl(var(--foreground))]">{formatCurrency(pricing.belowMinimumSurchargeCents)}</span></div>
              ) : null}
              {pricing?.lastMinuteSurchargeCents ? (
                <div className="flex justify-between text-[hsl(var(--muted-foreground))]"><span>{t("booking.lastMinuteSurcharge")}</span><span className="font-semibold text-[hsl(var(--foreground))]">{formatCurrency(pricing.lastMinuteSurchargeCents)}</span></div>
              ) : null}
              <div className="flex justify-between text-[hsl(var(--muted-foreground))]"><span>{t("booking.extras")}</span><span className="font-semibold text-[hsl(var(--foreground))]">{formatCurrency(extrasAmount)}</span></div>
              <div className="flex justify-between text-[hsl(var(--muted-foreground))]"><span>{t("booking.subtotal")}</span><span className="font-semibold text-[hsl(var(--foreground))]">{formatCurrency(subtotalBeforeTax)}</span></div>
              <div className="flex justify-between text-[hsl(var(--muted-foreground))]"><span>{vehicleRatesIncludeTax ? t("booking.taxExtrasOnly", { percentage: taxPercentage }) : t("booking.taxOnBooking", { percentage: taxPercentage })}</span><span className="font-semibold text-[hsl(var(--foreground))]">{formatCurrency(taxAmount)}</span></div>
            </div>
            <div className="mt-3 flex justify-between rounded-[1rem] bg-[hsl(var(--primary))] px-4 py-3 font-black text-[hsl(var(--primary-foreground))]"><span>{t("booking.total")}</span><span>{formatCurrency(totalAmount)}</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

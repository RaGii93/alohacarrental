"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Gauge, Home, Settings2, User } from "lucide-react";
import { isLicenseActive } from "@/lib/license";
import { getBlobProxyUrl } from "@/lib/blob";
import {
  calculateDays,
  evaluateBookingRules,
  formatCurrency,
  getMinimumDropoffDateForBooking,
} from "@/lib/pricing";
import { computeExtraLineTotal, resolveCategoryDailyRate } from "@/lib/booking-pricing-rules";
import { Step1Search } from "./Steps/Step1Search";
import { Step2Customer } from "./Steps/Step2Customer";
import { Step3Review } from "./Steps/Step3Review";
import { AvailabilityResult } from "@/actions/availability";
import type { BookingRuleSettings } from "@/lib/settings";
import { combineLaPazDateAndTime } from "@/lib/timezone";
import type { AdditionalDriverFormValue } from "@/components/shared/AdditionalDriversEditor";

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
  pickupCustomPlaceName: string;
  pickupCustomAddress: string;
  pickupCustomLatitude: number | null;
  pickupCustomLongitude: number | null;
  dropoffCustomPlaceName: string;
  dropoffCustomAddress: string;
  dropoffCustomLatitude: number | null;
  dropoffCustomLongitude: number | null;
  driverLicenseUrl: string;
  additionalDrivers: AdditionalDriverFormValue[];
  notes: string;
  termsAccepted: boolean;
  privacyConsentAccepted: boolean;
  selectedExtras: Array<{ extraId: string; quantity: number }>;
  isCruise: boolean;
}

type BookingWizardInitialData = {
  startDate?: Date | null;
  endDate?: Date | null;
  pickupTime?: string;
  dropoffTime?: string;
  categoryId?: string | null;
  pickupLocationId?: string;
  dropoffLocationId?: string;
  isCruise?: boolean;
};

export function BookingWizard({
  locale,
  locations,
  extras,
  categories,
  taxPercentage,
  vehicleRatesIncludeTax,
  bookingRuleSettings,
  termsPdfUrl,
  bookingSource = "public",
  initialData,
}: {
  locale: string;
  locations: { id: string; name: string; code?: string | null; address?: string | null; latitude?: number | null; longitude?: number | null }[];
  extras: { id: string; name: string; pricingType: "DAILY" | "FLAT"; amount: number; description?: string | null }[];
  categories: Array<{
    id: string;
    name: string;
    imageUrl?: string | null;
    dailyRate: number;
    seats: number;
    transmission: "AUTOMATIC" | "MANUAL";
    features: Array<{ name: string; iconName: string | null }>;
    cruiseDailyRate?: number | null;
  }>;
  taxPercentage: number;
  vehicleRatesIncludeTax: boolean;
  bookingRuleSettings: BookingRuleSettings;
  termsPdfUrl: string;
  bookingSource?: "public" | "admin";
  initialData?: BookingWizardInitialData;
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
    pickupCustomPlaceName: "",
    pickupCustomAddress: "",
    pickupCustomLatitude: null,
    pickupCustomLongitude: null,
    dropoffCustomPlaceName: "",
    dropoffCustomAddress: "",
    dropoffCustomLatitude: null,
    dropoffCustomLongitude: null,
    driverLicenseUrl: "",
    additionalDrivers: [],
    notes: "",
    termsAccepted: false,
    privacyConsentAccepted: false,
    selectedExtras: [],
    isCruise: false,
    ...initialData,
  });

  const licenseActive = isLicenseActive();

  const updateBookingData = (updates: Partial<BookingData>) => {
    setBookingData((prev) => {
      const next = { ...prev, ...updates };

      if (Object.prototype.hasOwnProperty.call(updates, "startDate")) {
        const nextStartDate = updates.startDate ?? null;
        const currentEndDate = updates.endDate ?? prev.endDate;

        if (nextStartDate && bookingSource === "public" && bookingRuleSettings.belowMinimumRentalAdminOnly) {
          const minimumDropoffDate = getMinimumDropoffDateForBooking({
            startDate: nextStartDate,
            selectedEndDate: currentEndDate,
            settings: bookingRuleSettings,
          });

          if (!currentEndDate || currentEndDate < minimumDropoffDate) {
            next.endDate = minimumDropoffDate;
          }
        }
      }

      return next;
    });
  };
  const selectedCategory = categories.find((c) => c.id === bookingData.categoryId) || null;
  const pickupDateTime = combineLaPazDateAndTime(bookingData.startDate, bookingData.pickupTime);
  const dropoffDateTime = combineLaPazDateAndTime(bookingData.endDate, bookingData.dropoffTime);
  const days =
    pickupDateTime && dropoffDateTime && dropoffDateTime > pickupDateTime
      ? calculateDays(pickupDateTime, dropoffDateTime)
      : 1;
  const effectiveDailyRate = selectedCategory
    ? resolveCategoryDailyRate({
        dailyRateCents: selectedCategory.dailyRate,
        cruiseDailyRateCents: selectedCategory.cruiseDailyRate,
        bookingSource,
        isCruise: bookingData.isCruise,
      })
    : 0;
  const baseAmount = effectiveDailyRate * days;
  const extrasAmount = bookingData.selectedExtras.reduce((sum, item) => {
    const extra = extras.find((row) => row.id === item.extraId);
    if (!extra) return sum;
    return sum + computeExtraLineTotal({
      extraName: extra.name,
      pricingType: extra.pricingType,
      amountCents: extra.amount,
      quantity: item.quantity,
      days,
      baseTotalCents: baseAmount,
    });
  }, 0);
  const pricing = pickupDateTime && dropoffDateTime && dropoffDateTime > pickupDateTime
    ? evaluateBookingRules({
        startDate: pickupDateTime,
        endDate: dropoffDateTime,
        basePriceCents: effectiveDailyRate,
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
    ? t("booking.errors.minimumDurationAdminOnly", { days: pricing.effectiveMinimumRentalDays })
    : pricing?.lastMinuteBlocked
      ? t("booking.errors.lastMinuteAdminOnly", { hours: bookingRuleSettings.lastMinuteBookingThresholdHours })
      : null;

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  const renderStepIndicator = () => (
    <div className="mb-10 flex items-center justify-center gap-3 sm:gap-4">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
            currentStep >= step
              ? "border-[#FF912C] bg-[#FF912C] text-white"
              : "border-[#e7dcd5] bg-white text-[#78716c]"
          }`}>
            {step}
          </div>
          {step < 4 && (
            <div className={`mx-2 h-1 w-10 rounded-full sm:w-14 ${
              currentStep > step ? "bg-[#FF912C]" : "bg-[#e7dcd5]"
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {!licenseActive && (
        <Alert className="mb-6 rounded-[1.5rem] border-orange-200 bg-orange-50/95">
          <AlertCircle className="h-4 w-4 text-[#FF912C]" />
          <AlertDescription className="text-[#FF912C]">{t("booking.errors.bookingDisabled")}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden rounded-[2rem] border-[#efe7df] bg-white p-6 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.18)] sm:p-8">
          <div className="mb-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#FF912C]">{t("nav.booking")}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#111111] sm:text-4xl">{t("booking.title")}</h1>
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
              bookingSource={bookingSource}
              isCruise={bookingData.isCruise}
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
              isCruise={bookingData.isCruise}
              bookingRuleSettings={bookingRuleSettings}
            />
          )}

          {currentStep === 4 && (
            <div className="text-center py-8">
              <h2 className="mb-4 text-2xl font-semibold text-[#111111]">{t("booking.bookingRequestReceived")}</h2>
              <p className="mb-6 text-[#57534e]">{t("booking.nextSteps")}</p>
              <Button
                onClick={() => window.location.href = `/${locale}`}
                className="h-12 rounded-full bg-[#FF912C] px-6 font-semibold text-white hover:bg-[#E67F1F]"
              >
                <Home className="h-4 w-4" />
                {t("nav.home")}
              </Button>
            </div>
          )}
        </Card>

        <Card className="h-fit rounded-[2rem] border border-[#efe7df] bg-[#faf8f6] p-4 text-[#111111] shadow-[0_30px_80px_-52px_rgba(0,0,0,0.18)] lg:sticky lg:top-24">
          <h3 className="mb-3 text-lg font-semibold tracking-[-0.02em] text-[#111111]">{t("booking.summary")}</h3>
          {selectedCategory?.imageUrl ? (
            <img
              src={selectedCategory.imageUrl.startsWith("/") ? selectedCategory.imageUrl : getBlobProxyUrl(selectedCategory.imageUrl) || selectedCategory.imageUrl}
              alt={selectedCategory.name}
              className="mb-3 h-40 w-full rounded-[1.25rem] border border-[#efe7df] bg-white object-cover"
            />
          ) : (
            <div className="mb-3 flex h-40 items-center justify-center rounded-[1.25rem] border border-[#efe7df] bg-white text-sm text-[#78716c]">
              {t("booking.selectCategory")}
            </div>
          )}
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-[#111111]">{selectedCategory?.name || "-"}</p>
            {summaryBlockedMessage ? (
              <div className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700">
                {summaryBlockedMessage}
              </div>
            ) : null}
            {selectedCategory ? (
              <div className="grid gap-2">
                <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[#44403c]">
                  <User className="h-3.5 w-3.5 text-[#FF912C]" />
                  <span>{selectedCategory.seats} seats</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[#44403c]">
                  <Settings2 className="h-3.5 w-3.5 text-[#FF912C]" />
                  <span>{selectedCategory.transmission === "MANUAL" ? "Manual" : "Automatic"}</span>
                </div>
                {selectedCategory.features.slice(0, 4).map((feature) => (
                  <div key={feature.name} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[#44403c]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#FF912C]" />
                    <span>{feature.name}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[#44403c]">
                  <Gauge className="h-3.5 w-3.5 text-[#FF912C]" />
                  <span>Standard performance</span>
                </div>
              </div>
            ) : (
              <p className="text-[#78716c]">-</p>
            )}
            <div className="mt-4 space-y-2 rounded-[1.25rem] border border-[#efe7df] bg-white p-4">
              <div className="flex justify-between text-[#57534e]"><span>{t("booking.pricePerDay")}</span><span className="font-semibold text-[#111111]">{selectedCategory ? formatCurrency(effectiveDailyRate) : "-"}</span></div>
              <div className="flex justify-between text-[#57534e]"><span>{t("booking.days")}</span><span className="font-semibold text-[#111111]">{days}</span></div>
              <div className="flex justify-between text-[#57534e]"><span>{t("booking.baseTotal")}</span><span className="font-semibold text-[#111111]">{formatCurrency(baseAmount)}</span></div>
              {pricing?.belowMinimumSurchargeCents ? (
                <div className="flex justify-between text-[#57534e]"><span>{t("booking.belowMinimumSurcharge")}</span><span className="font-semibold text-[#111111]">{formatCurrency(pricing.belowMinimumSurchargeCents)}</span></div>
              ) : null}
              {pricing?.lastMinuteSurchargeCents ? (
                <div className="flex justify-between text-[#57534e]"><span>{t("booking.lastMinuteSurcharge")}</span><span className="font-semibold text-[#111111]">{formatCurrency(pricing.lastMinuteSurchargeCents)}</span></div>
              ) : null}
              <div className="flex justify-between text-[#57534e]"><span>{t("booking.extras")}</span><span className="font-semibold text-[#111111]">{formatCurrency(extrasAmount)}</span></div>
              <div className="flex justify-between text-[#57534e]"><span>{t("booking.subtotal")}</span><span className="font-semibold text-[#111111]">{formatCurrency(subtotalBeforeTax)}</span></div>
              <div className="flex justify-between text-[#57534e]"><span>{vehicleRatesIncludeTax ? t("booking.taxExtrasOnly", { percentage: taxPercentage }) : t("booking.taxOnBooking", { percentage: taxPercentage })}</span><span className="font-semibold text-[#111111]">{formatCurrency(taxAmount)}</span></div>
            </div>
            <div className="mt-3 flex justify-between rounded-[1rem] bg-[#111111] px-4 py-3 font-semibold text-white"><span>{t("booking.total")}</span><span>{formatCurrency(totalAmount)}</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

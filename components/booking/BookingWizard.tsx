"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, AirVent, Gauge, Home, Settings2, Sofa } from "lucide-react";
import { isLicenseActive } from "@/lib/license";
import { getBlobProxyUrl } from "@/lib/blob";
import { calculateDays, formatCurrency } from "@/lib/pricing";
import { Step1Search } from "./Steps/Step1Search";
import { Step2Customer } from "./Steps/Step2Customer";
import { Step3Review } from "./Steps/Step3Review";
import { AvailabilityResult } from "@/actions/availability";

export interface BookingData {
  startDate: Date | null;
  endDate: Date | null;
  pickupTime: string;
  dropoffTime: string;
  categoryId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  birthDate: Date | null;
  driverLicenseNumber: string;
  licenseExpiryDate: Date | null;
  pickupLocationId: string;
  dropoffLocationId: string;
  driverLicenseUrl: string;
  notes: string;
  termsAccepted: boolean;
  selectedExtras: Array<{ extraId: string; quantity: number }>;
}

type BookingPrefill = {
  startDate?: string;
  endDate?: string;
  pickupTime?: string;
  dropoffTime?: string;
  pickupLocationId?: string;
  dropoffLocationId?: string;
};

export function BookingWizard({
  locale,
  locations,
  extras,
  categories,
  taxPercentage,
  minimumBookingDays,
  initialPrefill,
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
    hasAC: boolean;
  }>;
  taxPercentage: number;
  minimumBookingDays: number;
  initialPrefill?: BookingPrefill;
}) {
  const t = useTranslations();
  const [currentStep, setCurrentStep] = useState(1);
  const [availability, setAvailability] = useState<AvailabilityResult[]>([]);
  const parseDate = (value?: string): Date | null => {
    if (!value) return null;
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (dateOnly) {
      const year = Number(dateOnly[1]);
      const month = Number(dateOnly[2]);
      const day = Number(dateOnly[3]);
      const local = new Date(year, month - 1, day);
      return Number.isNaN(local.getTime()) ? null : local;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const [bookingData, setBookingData] = useState<BookingData>({
    startDate: parseDate(initialPrefill?.startDate),
    endDate: parseDate(initialPrefill?.endDate),
    pickupTime: initialPrefill?.pickupTime || "10:00",
    dropoffTime: initialPrefill?.dropoffTime || "10:00",
    categoryId: null,
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    birthDate: null,
    driverLicenseNumber: "",
    licenseExpiryDate: null,
    pickupLocationId: initialPrefill?.pickupLocationId || "",
    dropoffLocationId: initialPrefill?.dropoffLocationId || "",
    driverLicenseUrl: "",
    notes: "",
    termsAccepted: false,
    selectedExtras: [],
  });

  const licenseActive = isLicenseActive();

  const updateBookingData = (updates: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...updates }));
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
  const subtotalAmount = baseAmount + extrasAmount;
  const taxAmount = Math.round(subtotalAmount * (taxPercentage / 100));
  const totalAmount = subtotalAmount + taxAmount;

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-4 mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep >= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            {step}
          </div>
          {step < 4 && (
            <div className={`w-12 h-0.5 mx-2 ${
              currentStep > step ? "bg-primary" : "bg-muted"
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {!licenseActive && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t("booking.errors.bookingDisabled")}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-center mb-6">{t("booking.title")}</h1>

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
            />
          )}

          {currentStep === 4 && (
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold mb-4">{t("booking.bookingRequestReceived")}</h2>
              <p className="text-muted-foreground mb-6">{t("booking.nextSteps")}</p>
              <Button onClick={() => window.location.href = `/${locale}`}>
                <Home className="h-4 w-4" />
                {t("nav.home")}
              </Button>
            </div>
          )}
        </Card>

        <Card className="h-fit p-4 lg:sticky lg:top-20">
          <h3 className="mb-3 text-lg font-semibold">{t("booking.summary")}</h3>
          {selectedCategory?.imageUrl ? (
            <img
              src={selectedCategory.imageUrl.startsWith("/") ? selectedCategory.imageUrl : getBlobProxyUrl(selectedCategory.imageUrl) || selectedCategory.imageUrl}
              alt={selectedCategory.name}
              className="mb-3 h-40 w-full rounded-md border object-cover"
            />
          ) : (
            <div className="mb-3 flex h-40 items-center justify-center rounded-md border text-sm text-muted-foreground">
              {t("booking.selectCategory")}
            </div>
          )}
          <div className="space-y-2 text-sm">
            <p className="font-medium">{selectedCategory?.name || "-"}</p>
            {selectedCategory ? (
              <div className="space-y-1 text-muted-foreground">
                <p className="flex items-center gap-1.5"><Sofa className="h-3.5 w-3.5" />{selectedCategory.seats} seats</p>
                <p className="flex items-center gap-1.5"><Settings2 className="h-3.5 w-3.5" />{selectedCategory.transmission === "MANUAL" ? "Manual" : "Automatic"}</p>
                <p className="flex items-center gap-1.5"><AirVent className="h-3.5 w-3.5" />{selectedCategory.hasAC ? "A/C" : "No A/C"}</p>
                <p className="flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5" />Standard performance</p>
              </div>
            ) : (
              <p className="text-muted-foreground">-</p>
            )}
            <div className="flex justify-between"><span>{t("booking.pricePerDay")}</span><span>{selectedCategory ? formatCurrency(selectedCategory.dailyRate) : "-"}</span></div>
            <div className="flex justify-between"><span>{t("booking.days")}</span><span>{days}</span></div>
            <div className="flex justify-between"><span>{t("booking.extras")}</span><span>{formatCurrency(extrasAmount)}</span></div>
            <div className="flex justify-between"><span>{t("booking.tax", { percentage: taxPercentage })}</span><span>{formatCurrency(taxAmount)}</span></div>
            <div className="mt-2 border-t pt-2 flex justify-between font-semibold"><span>{t("booking.total")}</span><span>{formatCurrency(totalAmount)}</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

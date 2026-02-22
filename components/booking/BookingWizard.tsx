"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { isLicenseActive } from "@/lib/license";
import { Step1Search } from "./Steps/Step1Search";
import { Step2Customer } from "./Steps/Step2Customer";
import { Step3Review } from "./Steps/Step3Review";
import { AvailabilityResult } from "@/actions/availability";

export interface BookingData {
  startDate: Date | null;
  endDate: Date | null;
  categoryId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  driverLicenseNumber: string;
  pickupLocation: string;
  dropoffLocation: string;
  driverLicenseUrl: string;
  notes: string;
  termsAccepted: boolean;
}

export function BookingWizard({ locale, locations }: { locale: string; locations: { id: string; name: string; code?: string | null; address?: string | null }[] }) {
  const t = useTranslations();
  const [currentStep, setCurrentStep] = useState(1);
  const [availability, setAvailability] = useState<AvailabilityResult[]>([]);
  const [bookingData, setBookingData] = useState<BookingData>({
    startDate: null,
    endDate: null,
    categoryId: null,
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    driverLicenseNumber: "",
    pickupLocation: "",
    dropoffLocation: "",
    driverLicenseUrl: "",
    notes: "",
    termsAccepted: false,
  });

  const licenseActive = isLicenseActive();

  const updateBookingData = (updates: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...updates }));
  };

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
    <div className="max-w-4xl mx-auto">
      {!licenseActive && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t("booking.errors.bookingDisabled")}</AlertDescription>
        </Alert>
      )}

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
          />
        )}

        {currentStep === 2 && (
          <Step2Customer
            bookingData={bookingData}
            updateBookingData={updateBookingData}
            locations={locations}
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
            locale={locale}
            onPrev={prevStep}
            disabled={!licenseActive}
            availability={availability}
          />
        )}

        {currentStep === 4 && (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold mb-4">{t("booking.bookingRequestReceived")}</h2>
            <p className="text-muted-foreground mb-6">{t("booking.nextSteps")}</p>
            <Button onClick={() => window.location.href = `/${locale}`}>
              {t("nav.home")}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
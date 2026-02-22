"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ExternalLink } from "lucide-react";
import { AvailabilityResult } from "@/actions/availability";
import { createCategoryBookingAction } from "@/actions/booking";
import { calculateDays, formatCurrency } from "@/lib/pricing";
import { getTermsPdfUrl } from "@/lib/terms";
import { BookingData } from "../BookingWizard";

interface Step3ReviewProps {
  bookingData: BookingData;
  updateBookingData: (updates: Partial<BookingData>) => void;
  locations: { id: string; name: string; code?: string | null; address?: string | null }[];
  locale: string;
  onPrev: () => void;
  disabled: boolean;
  availability: AvailabilityResult[];
}

export function Step3Review({ bookingData, updateBookingData, locations, locale, onPrev, disabled, availability }: Step3ReviewProps) {
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
      formData.append("categoryId", bookingData.categoryId!);
      formData.append("customerName", bookingData.customerName);
      formData.append("customerEmail", bookingData.customerEmail);
      formData.append("customerPhone", bookingData.customerPhone);
      formData.append("birthDate", bookingData.birthDate.toISOString());
      formData.append("driverLicenseNumber", bookingData.driverLicenseNumber);
      formData.append("licenseExpiryDate", bookingData.licenseExpiryDate.toISOString());
      if (!pickupDateTime || !dropoffDateTime || dropoffDateTime <= pickupDateTime) {
        toast.error(t("booking.errors.endBeforeStart"));
        setIsSubmitting(false);
        return;
      }
      formData.append("startDate", pickupDateTime.toISOString());
      formData.append("endDate", dropoffDateTime.toISOString());
      formData.append("pickupLocationId", bookingData.pickupLocationId);
      formData.append("dropoffLocationId", bookingData.dropoffLocationId);
      formData.append("driverLicenseUrl", bookingData.driverLicenseUrl);
      formData.append("notes", bookingData.notes);
      formData.append("termsAccepted", "true");

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
  const totalAmount = categoryRate * days;
  const pickupLocation = locations.find((location) => location.id === bookingData.pickupLocationId);
  const dropoffLocation = locations.find((location) => location.id === bookingData.dropoffLocationId);
  const pickupLocationMapUrl = pickupLocation?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickupLocation.address)}`
    : null;
  const dropoffLocationMapUrl = dropoffLocation?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dropoffLocation.address)}`
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">{t("booking.reviewBooking")}</h2>

        <Card>
          <CardHeader>
            <CardTitle>{t("booking.summary")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">{t("booking.startDate")}</h4>
                <p>{pickupDateTime?.toLocaleString()}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">{t("booking.endDate")}</h4>
                <p>{dropoffDateTime?.toLocaleString()}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">{t("booking.category")}</h4>
              <p>{selectedCategory?.categoryName || "Unknown"}</p>
            </div>

            <div>
              <h4 className="font-medium mb-2">{t("booking.pricePerDay")}</h4>
              <p>{formatCurrency(categoryRate)}</p>
            </div>

            <div>
              <h4 className="font-medium mb-2">{t("booking.total")}</h4>
              <p className="text-lg font-semibold">{formatCurrency(totalAmount)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("booking.customerName")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>{t("booking.customerName")}:</strong> {bookingData.customerName}</p>
          <p><strong>{t("booking.customerEmail")}:</strong> {bookingData.customerEmail}</p>
          <p><strong>{t("booking.customerPhone")}:</strong> {bookingData.customerPhone}</p>
          <p><strong>{t("booking.birthDate")}:</strong> {bookingData.birthDate?.toLocaleDateString()}</p>
          <p><strong>{t("booking.driverLicenseNumber")}:</strong> {bookingData.driverLicenseNumber}</p>
          <p><strong>{t("booking.licenseExpiryDate")}:</strong> {bookingData.licenseExpiryDate?.toLocaleDateString()}</p>
          <p><strong>{t("booking.driverLicense")}:</strong> ✓ {t("common.success").toLowerCase()}</p>
        </CardContent>
      </Card>

      {(bookingData.pickupLocationId || bookingData.dropoffLocationId) && (
        <Card>
          <CardHeader>
            <CardTitle>{t("booking.pickupLocation")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bookingData.pickupLocationId && (
              <p>
                <strong>{t("booking.pickupLocation")}:</strong> {pickupLocation?.name}
                {pickupLocationMapUrl && (
                  <>
                    {" "}
                    <a href={pickupLocationMapUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      ({t("booking.map")})
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
                    <a href={dropoffLocationMapUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      ({t("booking.map")})
                    </a>
                  </>
                )}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {bookingData.notes && (
        <Card>
          <CardHeader>
            <CardTitle>{t("booking.notes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{bookingData.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("booking.terms")}</CardTitle>
          <CardDescription>
            {t("booking.termsRequired")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            onClick={() => window.open(getTermsPdfUrl(), '_blank')}
            className="w-full"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            {t("booking.viewTerms")}
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrev}>
          {t("booking.back")}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!bookingData.termsAccepted || !bookingData.birthDate || !bookingData.licenseExpiryDate || isSubmitting || disabled}
        >
          {isSubmitting ? t("common.loading") : t("booking.confirmBooking")}
        </Button>
      </div>
    </div>
  );
}

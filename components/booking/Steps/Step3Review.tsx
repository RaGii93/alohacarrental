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
  extras: { id: string; name: string; pricingType: "DAILY" | "FLAT"; amount: number; description?: string | null }[];
  locale: string;
  onPrev: () => void;
  disabled: boolean;
  availability: AvailabilityResult[];
}

export function Step3Review({ bookingData, updateBookingData, locations, extras, locale, onPrev, disabled, availability }: Step3ReviewProps) {
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
      formData.append("selectedExtras", JSON.stringify(bookingData.selectedExtras));
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
  const baseAmount = categoryRate * days;
  const extrasAmount = bookingData.selectedExtras.reduce((sum, item) => {
    const extra = extras.find((row) => row.id === item.extraId);
    if (!extra) return sum;
    return sum + (extra.pricingType === "DAILY" ? extra.amount * days * item.quantity : extra.amount * item.quantity);
  }, 0);
  const totalAmount = baseAmount + extrasAmount;
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

            {extrasAmount > 0 && (
              <div>
                <h4 className="font-medium mb-2">Extras</h4>
                <p>{formatCurrency(extrasAmount)}</p>
              </div>
            )}

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

      {extras.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Extras</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {extras.map((extra) => {
              const line = bookingData.selectedExtras.find((entry) => entry.extraId === extra.id);
              const checked = !!line;
              return (
                <div key={extra.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
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
                      className="h-8 w-16 rounded-md border px-2 text-sm"
                    />
                  </div>
                </div>
              );
            })}
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

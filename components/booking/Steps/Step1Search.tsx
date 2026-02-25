"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { searchAvailabilityAction, AvailabilityResult } from "@/actions/availability";
import { calculateDays, formatCurrency } from "@/lib/pricing";
import { getBlobProxyUrl } from "@/lib/blob";
import { BookingData } from "../BookingWizard";
import {
  AirVent,
  CalendarDays,
  Clock3,
  Gauge,
  MapPin,
  Search,
  Settings2,
  Sofa,
  ArrowRight,
} from "lucide-react";

interface Step1SearchProps {
  bookingData: BookingData;
  updateBookingData: (updates: Partial<BookingData>) => void;
  onNext: () => void;
  disabled: boolean;
  setAvailability: (availability: AvailabilityResult[]) => void;
  availability: AvailabilityResult[];
  locations: { id: string; name: string; code?: string | null; address?: string | null }[];
  minimumBookingDays: number;
}

export function Step1Search({
  bookingData,
  updateBookingData,
  onNext,
  disabled,
  setAvailability,
  availability,
  locations,
  minimumBookingDays,
}: Step1SearchProps) {
  const t = useTranslations();
  const [isSearching, setIsSearching] = useState(false);

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
  const hasValidRange = !!pickupDateTime && !!dropoffDateTime && dropoffDateTime > pickupDateTime;
  const selectedDays = hasValidRange && pickupDateTime && dropoffDateTime
    ? calculateDays(pickupDateTime, dropoffDateTime)
    : 0;
  const meetsMinimumDuration = !hasValidRange || selectedDays >= minimumBookingDays;

  const handleSearch = async () => {
    if (!pickupDateTime || !dropoffDateTime || dropoffDateTime <= pickupDateTime) return;
    if (calculateDays(pickupDateTime, dropoffDateTime) < minimumBookingDays) return;

    setIsSearching(true);
    try {
      const results = await searchAvailabilityAction(pickupDateTime, dropoffDateTime);
      setAvailability(results);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    updateBookingData({ categoryId });
  };

  const hasLocations = !!bookingData.pickupLocationId && !!bookingData.dropoffLocationId;
  const canContinue = bookingData.categoryId && availability.length > 0 && hasValidRange && hasLocations && meetsMinimumDuration;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">{t("booking.selectDateRange")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              {t("booking.startDate")}
            </label>
            <DatePicker
              value={bookingData.startDate}
              onChange={(date) => updateBookingData({ startDate: date })}
              placeholder={t("booking.selectDateRange")}
              hideIcon
              disabled={disabled}
              fromYear={new Date().getFullYear()}
              toYear={new Date().getFullYear() + 3}
              disabledDate={(date) => date < new Date() || date < new Date("1900-01-01")}
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              {t("booking.endDate")}
            </label>
            <DatePicker
              value={bookingData.endDate}
              onChange={(date) => updateBookingData({ endDate: date })}
              placeholder={t("booking.selectDateRange")}
              hideIcon
              disabled={disabled}
              fromYear={new Date().getFullYear()}
              toYear={new Date().getFullYear() + 3}
              disabledDate={(date) => date < new Date() || date < new Date("1900-01-01")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Clock3 className="h-4 w-4 text-muted-foreground" />
              {t("booking.pickupTime")}
            </label>
            <Input
              type="time"
              value={bookingData.pickupTime}
              onChange={(e) => updateBookingData({ pickupTime: e.target.value })}
              disabled={disabled}
            />
          </div>
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Clock3 className="h-4 w-4 text-muted-foreground" />
              {t("booking.dropoffTime")}
            </label>
            <Input
              type="time"
              value={bookingData.dropoffTime}
              onChange={(e) => updateBookingData({ dropoffTime: e.target.value })}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label className="mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {t("booking.pickupLocation")}
            </Label>
            <Select
              value={bookingData.pickupLocationId}
              onValueChange={(value) => updateBookingData({ pickupLocationId: value })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("booking.selectLocation")} />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}{loc.address ? ` - ${loc.address}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {t("booking.dropoffLocation")}
            </Label>
            <Select
              value={bookingData.dropoffLocationId}
              onValueChange={(value) => updateBookingData({ dropoffLocationId: value })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("booking.selectLocation")} />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}{loc.address ? ` - ${loc.address}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!hasValidRange && bookingData.startDate && bookingData.endDate && (
          <p className="text-sm text-red-600 mt-3">{t("booking.errors.endBeforeStart")}</p>
        )}
        {hasValidRange && !meetsMinimumDuration && (
          <p className="text-sm text-red-600 mt-2">
            {t("booking.errors.minimumDuration", { days: minimumBookingDays })}
          </p>
        )}
        {!hasLocations && (
          <p className="text-sm text-red-600 mt-2">{t("booking.selectLocation")}</p>
        )}

        <div className="mt-4">
          <Button
            onClick={handleSearch}
            disabled={!hasValidRange || !meetsMinimumDuration || isSearching || disabled}
            className="w-full"
          >
            <Search className="h-4 w-4" />
            {isSearching ? t("common.loading") : t("booking.searchAvailability")}
          </Button>
        </div>
      </div>

      {availability.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">{t("booking.selectCategory")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availability.map((cat) => {
              const isSelected = bookingData.categoryId === cat.categoryId;
              const isAvailable = cat.availableCount > 0;
              const days = pickupDateTime && dropoffDateTime ? calculateDays(pickupDateTime, dropoffDateTime) : 1;

              return (
                <Card
                  key={cat.categoryId}
                  className={cn(
                    "cursor-pointer transition-all",
                    isSelected && "ring-2 ring-primary",
                    !isAvailable && "opacity-50"
                  )}
                  onClick={() => isAvailable && handleCategorySelect(cat.categoryId)}
                >
                  {cat.categoryImageUrl ? (
                    <img
                      src={cat.categoryImageUrl.startsWith("/") ? cat.categoryImageUrl : getBlobProxyUrl(cat.categoryImageUrl) || cat.categoryImageUrl}
                      alt={cat.categoryName}
                      className="h-32 w-full rounded-t-lg object-cover"
                    />
                  ) : null}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{cat.categoryName}</CardTitle>
                    <CardDescription>
                      {formatCurrency(cat.dailyRate)} / {t("booking.days").toLowerCase()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t("booking.available")}:</span>
                        <Badge variant={isAvailable ? "default" : "secondary"}>
                          {isAvailable ? cat.availableCount : t("booking.soldOut")}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t("booking.total")}:</span>
                        <span className="font-semibold">{formatCurrency(cat.totalForRange)}</span>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1.5">
                          <Sofa className="h-3.5 w-3.5" />
                          {(cat.seats ?? 5)} seats
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Settings2 className="h-3.5 w-3.5" />
                          {cat.transmission === "MANUAL" ? "Manual" : "Automatic"}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <AirVent className="h-3.5 w-3.5" />
                          {cat.hasAC === false ? "No A/C" : "A/C"}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Gauge className="h-3.5 w-3.5" />
                          Standard performance
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button
          onClick={onNext}
          disabled={!canContinue || disabled}
        >
          <ArrowRight className="h-4 w-4" />
          {t("booking.continue")}
        </Button>
      </div>
    </div>
  );
}

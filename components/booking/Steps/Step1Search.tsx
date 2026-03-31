"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { searchAvailabilityAction, AvailabilityResult } from "@/actions/availability";
import { calculateDays, evaluateBookingRules, formatCurrency, type BookingSource } from "@/lib/pricing";
import { getBlobProxyUrl } from "@/lib/blob";
import { BookingData } from "../BookingWizard";
import type { BookingRuleSettings } from "@/lib/settings";
import {
  CalendarDays,
  CheckCircle2,
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
  bookingSource: BookingSource;
  bookingRuleSettings: BookingRuleSettings;
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
  bookingSource,
  bookingRuleSettings,
}: Step1SearchProps) {
  const t = useTranslations();
  const [isSearching, setIsSearching] = useState(false);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const toDateInputValue = (date: Date | null) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const fromDateInputValue = (value: string) => (value ? new Date(`${value}T12:00:00`) : null);

  const minimumEndDate = bookingData.startDate ? new Date(bookingData.startDate) : null;
  if (minimumEndDate && bookingSource === "public" && bookingRuleSettings.belowMinimumRentalAdminOnly) {
    minimumEndDate.setHours(0, 0, 0, 0);
    minimumEndDate.setDate(minimumEndDate.getDate() + minimumBookingDays);
  }

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
  const bookingRules = hasValidRange && pickupDateTime && dropoffDateTime
    ? evaluateBookingRules({
        startDate: pickupDateTime,
        endDate: dropoffDateTime,
        basePriceCents: 0,
        bookingSource,
        settings: bookingRuleSettings,
      })
    : null;
  const blockedMessage = bookingRules?.belowMinimumBlocked
    ? t("booking.errors.minimumDurationAdminOnly", { days: bookingRuleSettings.minimumRentalDays })
    : bookingRules?.lastMinuteBlocked
      ? t("booking.errors.lastMinuteAdminOnly", { hours: bookingRuleSettings.lastMinuteBookingThresholdHours })
      : null;

  const handleSearch = async () => {
    if (!pickupDateTime || !dropoffDateTime || dropoffDateTime <= pickupDateTime) return;
    if (blockedMessage) return;

    setIsSearching(true);
    try {
      const results = await searchAvailabilityAction(pickupDateTime, dropoffDateTime, bookingSource);
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
  const canContinue = bookingData.categoryId && availability.length > 0 && hasValidRange && hasLocations && !blockedMessage;

  return (
    <div className="space-y-6">
      <div className="public-glass-card rounded-[1.75rem] p-6">
        <h2 className="mb-4 text-xl font-black text-[hsl(var(--foreground))]">{t("booking.selectDateRange")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-[hsl(var(--accent-foreground))]">
              <CalendarDays className="h-4 w-4 text-[hsl(var(--primary))]" />
              {t("booking.startDate")}
            </label>
            <Input
              type="date"
              value={toDateInputValue(bookingData.startDate)}
              onChange={(e) => updateBookingData({ startDate: fromDateInputValue(e.target.value) })}
              disabled={disabled}
              min={toDateInputValue(today)}
              className="h-11 rounded-xl border-white/60 bg-white/82 text-[hsl(var(--foreground))] shadow-[inset_0_1px_0_rgba(255,255,255,0.64)] ring-1 ring-white/55 backdrop-blur-xl"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-[hsl(var(--accent-foreground))]">
              <CalendarDays className="h-4 w-4 text-[hsl(var(--primary))]" />
              {t("booking.endDate")}
            </label>
            <Input
              type="date"
              value={toDateInputValue(bookingData.endDate)}
              onChange={(e) => updateBookingData({ endDate: fromDateInputValue(e.target.value) })}
              disabled={disabled}
              min={toDateInputValue(minimumEndDate ?? today)}
              className="h-11 rounded-xl border-white/60 bg-white/82 text-[hsl(var(--foreground))] shadow-[inset_0_1px_0_rgba(255,255,255,0.64)] ring-1 ring-white/55 backdrop-blur-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-[hsl(var(--accent-foreground))]">
              <Clock3 className="h-4 w-4 text-[hsl(var(--primary))]" />
              {t("booking.pickupTime")}
            </label>
            <Input
              type="time"
              value={bookingData.pickupTime}
              onChange={(e) => updateBookingData({ pickupTime: e.target.value })}
              disabled={disabled}
              className="h-11 rounded-xl border-white/60 bg-white/82 text-[hsl(var(--foreground))] shadow-[inset_0_1px_0_rgba(255,255,255,0.64)] ring-1 ring-white/55 backdrop-blur-xl"
            />
          </div>
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-bold text-[hsl(var(--accent-foreground))]">
              <Clock3 className="h-4 w-4 text-[hsl(var(--primary))]" />
              {t("booking.dropoffTime")}
            </label>
            <Input
              type="time"
              value={bookingData.dropoffTime}
              onChange={(e) => updateBookingData({ dropoffTime: e.target.value })}
              disabled={disabled}
              className="h-11 rounded-xl border-white/60 bg-white/82 text-[hsl(var(--foreground))] shadow-[inset_0_1px_0_rgba(255,255,255,0.64)] ring-1 ring-white/55 backdrop-blur-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label className="mb-2 flex items-center gap-2 font-bold text-[hsl(var(--accent-foreground))]">
              <MapPin className="h-4 w-4 text-[hsl(var(--primary))]" />
              {t("booking.pickupLocation")}
            </Label>
            <Select
              value={bookingData.pickupLocationId}
              onValueChange={(value) => updateBookingData({ pickupLocationId: value })}
              disabled={disabled}
            >
              <SelectTrigger className="h-11 w-full rounded-xl border-white/60 bg-white/82 text-[hsl(var(--foreground))] shadow-[inset_0_1px_0_rgba(255,255,255,0.64)] ring-1 ring-white/55 backdrop-blur-xl">
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
            <Label className="mb-2 flex items-center gap-2 font-bold text-[hsl(var(--accent-foreground))]">
              <MapPin className="h-4 w-4 text-[hsl(var(--primary))]" />
              {t("booking.dropoffLocation")}
            </Label>
            <Select
              value={bookingData.dropoffLocationId}
              onValueChange={(value) => updateBookingData({ dropoffLocationId: value })}
              disabled={disabled}
            >
              <SelectTrigger className="h-11 w-full rounded-xl border-white/60 bg-white/82 text-[hsl(var(--foreground))] shadow-[inset_0_1px_0_rgba(255,255,255,0.64)] ring-1 ring-white/55 backdrop-blur-xl">
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
        {blockedMessage && (
          <p className="text-sm text-red-600 mt-2">
            {blockedMessage}
          </p>
        )}
        {!hasLocations && (
          <p className="text-sm text-red-600 mt-2">{t("booking.selectLocation")}</p>
        )}

        <div className="mt-4">
          <Button
            onClick={handleSearch}
            disabled={!hasValidRange || !!blockedMessage || isSearching || disabled}
            className="public-primary-button h-12 w-full rounded-full font-extrabold uppercase tracking-[0.08em]"
          >
            <Search className="h-4 w-4" />
            {isSearching ? t("common.loading") : t("booking.searchAvailability")}
          </Button>
        </div>
      </div>

      {availability.length > 0 && (
        <div className="public-glass-card rounded-[1.75rem] p-6">
          <h3 className="mb-4 text-lg font-black text-[hsl(var(--foreground))]">{t("booking.selectCategory")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availability.map((cat) => {
              const isSelected = bookingData.categoryId === cat.categoryId;
              const isAvailable = cat.availableCount > 0;
              const days = pickupDateTime && dropoffDateTime ? calculateDays(pickupDateTime, dropoffDateTime) : 1;
              const cardBlockedMessage = cat.belowMinimumBlocked
                ? t("booking.errors.minimumDurationAdminOnly", { days: bookingRuleSettings.minimumRentalDays })
                : cat.lastMinuteBlocked
                  ? t("booking.errors.lastMinuteAdminOnly", { hours: bookingRuleSettings.lastMinuteBookingThresholdHours })
                  : null;

              return (
                <Card
                  key={cat.categoryId}
                  className={cn(
                    "cursor-pointer overflow-hidden rounded-[1.5rem] border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.8),hsl(var(--accent)/0.08)_100%)] shadow-[0_20px_50px_-40px_hsl(var(--foreground)/0.12)] ring-1 ring-white/60 transition-all backdrop-blur-xl hover:-translate-y-1 hover:shadow-[0_28px_60px_-40px_hsl(var(--foreground)/0.16)]",
                    isSelected && "border-transparent ring-2 ring-[hsl(var(--primary)/0.18)] shadow-[0_28px_60px_-34px_hsl(var(--primary)/0.18)]",
                    !isAvailable && "opacity-50"
                  )}
                  onClick={() => isAvailable && handleCategorySelect(cat.categoryId)}
                >
                  {cat.categoryImageUrl ? (
                    <img
                      src={cat.categoryImageUrl.startsWith("/") ? cat.categoryImageUrl : getBlobProxyUrl(cat.categoryImageUrl) || cat.categoryImageUrl}
                      alt={cat.categoryName}
                      className="h-32 w-full object-cover"
                    />
                  ) : null}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-black text-[hsl(var(--foreground))]">{cat.categoryName}</CardTitle>
                    <CardDescription className="font-semibold text-[hsl(var(--accent-foreground))]">
                      {formatCurrency(cat.dailyRate)} / {t("booking.days").toLowerCase()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {cardBlockedMessage ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                          {cardBlockedMessage}
                        </div>
                      ) : null}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">{t("booking.baseTotal")}:</span>
                        <span className="font-bold text-[hsl(var(--foreground))]">{formatCurrency(cat.baseTotalForRange)}</span>
                      </div>
                      {cat.belowMinimumSurcharge > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-[hsl(var(--muted-foreground))]">{t("booking.belowMinimumSurcharge")}:</span>
                          <span className="font-bold text-[hsl(var(--foreground))]">{formatCurrency(cat.belowMinimumSurcharge)}</span>
                        </div>
                      )}
                      {cat.lastMinuteSurcharge > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-[hsl(var(--muted-foreground))]">{t("booking.lastMinuteSurcharge")}:</span>
                          <span className="font-bold text-[hsl(var(--foreground))]">{formatCurrency(cat.lastMinuteSurcharge)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[hsl(var(--muted-foreground))]">{t("booking.total")}:</span>
                        <span className="font-bold text-[hsl(var(--foreground))]">{formatCurrency(cat.totalForRange)}</span>
                      </div>
                      <div className="space-y-1 text-xs text-[hsl(var(--muted-foreground))]">
                        <p className="flex items-center gap-1.5">
                          <Sofa className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                          {(cat.seats ?? 5)} seats
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Settings2 className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                          {cat.transmission === "MANUAL" ? "Manual" : "Automatic"}
                        </p>
                        {(cat.features || []).slice(0, 4).map((feature) => (
                          <p key={feature} className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                            {feature}
                          </p>
                        ))}
                        <p className="flex items-center gap-1.5">
                          <Gauge className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
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
          className="h-12 rounded-md bg-[hsl(var(--primary))] px-6 font-extrabold uppercase tracking-[0.08em] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary)/0.9)]"
        >
          <ArrowRight className="h-4 w-4" />
          {t("booking.continue")}
        </Button>
      </div>
    </div>
  );
}

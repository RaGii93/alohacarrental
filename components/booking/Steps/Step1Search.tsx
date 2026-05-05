"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapLocationPickerDialog } from "@/components/shared/MapLocationPickerDialog";
import { cn } from "@/lib/utils";
import { searchAvailabilityAction, AvailabilityResult } from "@/actions/availability";
import { calculateDays, evaluateBookingRules, formatCurrency, type BookingSource } from "@/lib/pricing";
import { getBlobProxyUrl } from "@/lib/blob";
import { BookingData } from "../BookingWizard";
import type { BookingRuleSettings } from "@/lib/settings";
import {
  addLaPazDays,
  combineLaPazDateAndTime,
  getLaPazToday,
  startOfLaPazDay,
} from "@/lib/timezone";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gauge,
  MapPin,
  Search,
  Settings2,
  User,
  ArrowRight,
} from "lucide-react";

function normalizeLocationName(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function isAccommodationLocationName(value: string | null | undefined) {
  const normalized = normalizeLocationName(value);
  return normalized.includes("accomodation") || normalized.includes("accommodation");
}

interface Step1SearchProps {
  bookingData: BookingData;
  updateBookingData: (updates: Partial<BookingData>) => void;
  onNext: () => void;
  disabled: boolean;
  setAvailability: (availability: AvailabilityResult[]) => void;
  availability: AvailabilityResult[];
  locations: { id: string; name: string; code?: string | null; address?: string | null; latitude?: number | null; longitude?: number | null }[];
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
  const [activeMapTarget, setActiveMapTarget] = useState<"pickup" | "dropoff" | null>(null);
  const today = getLaPazToday();
  const pickupLocationRecord = locations.find((location) => location.id === bookingData.pickupLocationId);
  const dropoffLocationRecord = locations.find((location) => location.id === bookingData.dropoffLocationId);
  const pickupIsAccommodation = isAccommodationLocationName(pickupLocationRecord?.name);
  const dropoffIsAccommodation = isAccommodationLocationName(dropoffLocationRecord?.name);

  const minimumEndDate = bookingData.startDate ? new Date(bookingData.startDate) : null;
  if (minimumEndDate && bookingSource === "public" && bookingRuleSettings.belowMinimumRentalAdminOnly) {
    const nextMinimumEndDate = addLaPazDays(startOfLaPazDay(minimumEndDate), minimumBookingDays);
    minimumEndDate.setTime(nextMinimumEndDate.getTime());
  }

  const pickupDateTime = combineLaPazDateAndTime(bookingData.startDate, bookingData.pickupTime);
  const dropoffDateTime = combineLaPazDateAndTime(bookingData.endDate, bookingData.dropoffTime);
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
  const hasPickupAccommodationDetails =
    !pickupIsAccommodation ||
    (
      bookingData.pickupCustomPlaceName.trim().length > 0 &&
      bookingData.pickupCustomAddress.trim().length > 0 &&
      bookingData.pickupCustomLatitude !== null &&
      bookingData.pickupCustomLongitude !== null
    );
  const hasDropoffAccommodationDetails =
    !dropoffIsAccommodation ||
    (
      bookingData.dropoffCustomPlaceName.trim().length > 0 &&
      bookingData.dropoffCustomAddress.trim().length > 0 &&
      bookingData.dropoffCustomLatitude !== null &&
      bookingData.dropoffCustomLongitude !== null
    );
  const canContinue =
    bookingData.categoryId &&
    availability.length > 0 &&
    hasValidRange &&
    hasLocations &&
    !blockedMessage &&
    hasPickupAccommodationDetails &&
    hasDropoffAccommodationDetails;

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-[#efe7df] bg-[#faf8f6] p-6 shadow-[0_24px_60px_-46px_rgba(0,0,0,0.16)]">
        <h2 className="mb-4 text-xl font-semibold text-[#111111]">{t("booking.selectDateRange")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#44403c]">
              <CalendarDays className="h-4 w-4 text-[#FF912C]" />
              {t("booking.startDate")}
            </label>
            <DatePicker
              value={bookingData.startDate}
              onChange={(date) => updateBookingData({ startDate: date })}
              disabled={disabled}
              placeholder={t("booking.startDate")}
              minDate={today}
              className="h-11 rounded-xl border-[#ece7e2] bg-white text-[#111111]"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#44403c]">
              <CalendarDays className="h-4 w-4 text-[#FF912C]" />
              {t("booking.endDate")}
            </label>
            <DatePicker
              value={bookingData.endDate}
              onChange={(date) => updateBookingData({ endDate: date })}
              disabled={disabled}
              placeholder={t("booking.endDate")}
              minDate={minimumEndDate ?? today}
              className="h-11 rounded-xl border-[#ece7e2] bg-white text-[#111111]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#44403c]">
              <Clock3 className="h-4 w-4 text-[#FF912C]" />
              {t("booking.pickupTime")}
            </label>
            <Input
              type="time"
              value={bookingData.pickupTime}
              onChange={(e) => updateBookingData({ pickupTime: e.target.value })}
              disabled={disabled}
              className="h-11 rounded-xl border-[#ece7e2] bg-white text-[#111111]"
            />
          </div>
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#44403c]">
              <Clock3 className="h-4 w-4 text-[#FF912C]" />
              {t("booking.dropoffTime")}
            </label>
            <Input
              type="time"
              value={bookingData.dropoffTime}
              onChange={(e) => updateBookingData({ dropoffTime: e.target.value })}
              disabled={disabled}
              className="h-11 rounded-xl border-[#ece7e2] bg-white text-[#111111]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label className="mb-2 flex items-center gap-2 font-semibold text-[#44403c]">
              <MapPin className="h-4 w-4 text-[#FF912C]" />
              {t("booking.pickupLocation")}
            </Label>
            <Select
              value={bookingData.pickupLocationId}
              onValueChange={(value) => {
                const selectedLocation = locations.find((location) => location.id === value);
                const selectedIsAccommodation = isAccommodationLocationName(selectedLocation?.name);
                updateBookingData({
                  pickupLocationId: value,
                  pickupCustomPlaceName: selectedIsAccommodation ? bookingData.pickupCustomPlaceName : "",
                  pickupCustomAddress: selectedIsAccommodation ? bookingData.pickupCustomAddress : "",
                  pickupCustomLatitude: selectedIsAccommodation ? bookingData.pickupCustomLatitude : null,
                  pickupCustomLongitude: selectedIsAccommodation ? bookingData.pickupCustomLongitude : null,
                });
              }}
              disabled={disabled}
            >
              <SelectTrigger className="h-11 w-full rounded-xl border-[#ece7e2] bg-white text-[#111111]">
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
            {pickupIsAccommodation && (
              <div className="mt-3 grid grid-cols-1 gap-3">
                <div>
                  <Label htmlFor="pickupCustomPlaceName" className="mb-2 block font-semibold text-[#44403c]">
                    {t("booking.accommodationPlaceName")}
                  </Label>
                  <Input
                    id="pickupCustomPlaceName"
                    value={bookingData.pickupCustomPlaceName}
                    onChange={(e) => updateBookingData({ pickupCustomPlaceName: e.target.value })}
                    disabled={disabled}
                    placeholder={t("booking.accommodationPlaceNamePlaceholder")}
                    className="h-11 rounded-xl border-[#ece7e2] bg-white text-[#111111]"
                  />
                </div>
                <div>
                  <Label className="mb-2 block font-semibold text-[#44403c]">
                    {t("booking.accommodationAddress")}
                  </Label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      value={bookingData.pickupCustomAddress}
                      readOnly
                      disabled
                      placeholder={t("booking.accommodationAddressPlaceholder")}
                      className="h-11 rounded-xl border-[#ece7e2] bg-white text-[#111111]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveMapTarget("pickup")}
                      disabled={disabled}
                      className="h-11 rounded-full border-[#e7dcd5] bg-white text-[#111111] hover:bg-[#faf8f6]"
                    >
                      <MapPin className="h-4 w-4" />
                      {t("booking.openMapPicker")}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-[#78716c]">{t("booking.accommodationAddressHelp")}</p>
                  {bookingData.pickupCustomLatitude !== null && bookingData.pickupCustomLongitude !== null ? (
                    <p className="mt-2 text-xs text-[#57534e]">
                      {t("booking.selectedCoordinates", {
                        latitude: bookingData.pickupCustomLatitude.toFixed(6),
                        longitude: bookingData.pickupCustomLongitude.toFixed(6),
                      })}
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <div>
            <Label className="mb-2 flex items-center gap-2 font-semibold text-[#44403c]">
              <MapPin className="h-4 w-4 text-[#FF912C]" />
              {t("booking.dropoffLocation")}
            </Label>
            <Select
              value={bookingData.dropoffLocationId}
              onValueChange={(value) => {
                const selectedLocation = locations.find((location) => location.id === value);
                const selectedIsAccommodation = isAccommodationLocationName(selectedLocation?.name);
                updateBookingData({
                  dropoffLocationId: value,
                  dropoffCustomPlaceName: selectedIsAccommodation ? bookingData.dropoffCustomPlaceName : "",
                  dropoffCustomAddress: selectedIsAccommodation ? bookingData.dropoffCustomAddress : "",
                  dropoffCustomLatitude: selectedIsAccommodation ? bookingData.dropoffCustomLatitude : null,
                  dropoffCustomLongitude: selectedIsAccommodation ? bookingData.dropoffCustomLongitude : null,
                });
              }}
              disabled={disabled}
            >
              <SelectTrigger className="h-11 w-full rounded-xl border-[#ece7e2] bg-white text-[#111111]">
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
            {dropoffIsAccommodation && (
              <div className="mt-3 grid grid-cols-1 gap-3">
                <div>
                  <Label htmlFor="dropoffCustomPlaceName" className="mb-2 block font-semibold text-[#44403c]">
                    {t("booking.accommodationPlaceName")}
                  </Label>
                  <Input
                    id="dropoffCustomPlaceName"
                    value={bookingData.dropoffCustomPlaceName}
                    onChange={(e) => updateBookingData({ dropoffCustomPlaceName: e.target.value })}
                    disabled={disabled}
                    placeholder={t("booking.accommodationPlaceNamePlaceholder")}
                    className="h-11 rounded-xl border-[#ece7e2] bg-white text-[#111111]"
                  />
                </div>
                <div>
                  <Label className="mb-2 block font-semibold text-[#44403c]">
                    {t("booking.accommodationAddress")}
                  </Label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      value={bookingData.dropoffCustomAddress}
                      readOnly
                      disabled
                      placeholder={t("booking.accommodationAddressPlaceholder")}
                      className="h-11 rounded-xl border-[#ece7e2] bg-white text-[#111111]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveMapTarget("dropoff")}
                      disabled={disabled}
                      className="h-11 rounded-full border-[#e7dcd5] bg-white text-[#111111] hover:bg-[#faf8f6]"
                    >
                      <MapPin className="h-4 w-4" />
                      {t("booking.openMapPicker")}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-[#78716c]">{t("booking.accommodationAddressHelp")}</p>
                  {bookingData.dropoffCustomLatitude !== null && bookingData.dropoffCustomLongitude !== null ? (
                    <p className="mt-2 text-xs text-[#57534e]">
                      {t("booking.selectedCoordinates", {
                        latitude: bookingData.dropoffCustomLatitude.toFixed(6),
                        longitude: bookingData.dropoffCustomLongitude.toFixed(6),
                      })}
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>

        {!hasValidRange && bookingData.startDate && bookingData.endDate && (
          <p className="text-sm text-[#FF912C] mt-3">{t("booking.errors.endBeforeStart")}</p>
        )}
        {blockedMessage && (
          <p className="text-sm text-[#FF912C] mt-2">
            {blockedMessage}
          </p>
        )}
        {!hasLocations && (
          <p className="text-sm text-[#FF912C] mt-2">{t("booking.selectLocation")}</p>
        )}
        {!hasPickupAccommodationDetails && (
          <p className="text-sm text-[#FF912C] mt-2">{t("booking.errors.accommodationDetailsRequired")}</p>
        )}
        {!hasDropoffAccommodationDetails && (
          <p className="text-sm text-[#FF912C] mt-2">{t("booking.errors.accommodationDetailsRequired")}</p>
        )}

        <div className="mt-4">
          <Button
            onClick={handleSearch}
            disabled={
              !hasValidRange ||
              !!blockedMessage ||
              isSearching ||
              disabled ||
              !hasPickupAccommodationDetails ||
              !hasDropoffAccommodationDetails
            }
            className="h-12 w-full rounded-full bg-[#FF912C] font-semibold text-white shadow-[0_20px_40px_-24px_rgba(255,145,44,0.45)] hover:bg-[#E67F1F]"
          >
            <Search className="h-4 w-4" />
            {isSearching ? t("common.loading") : t("booking.searchAvailability")}
          </Button>
        </div>
      </div>

      {availability.length > 0 && (
        <div className="rounded-[1.75rem] border border-[#efe7df] bg-white p-6 shadow-[0_24px_60px_-46px_rgba(0,0,0,0.16)]">
          <h3 className="mb-4 text-lg font-semibold text-[#111111]">{t("booking.selectCategory")}</h3>
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
                    "cursor-pointer overflow-hidden rounded-[1.5rem] border-[#c7daf9] bg-white shadow-[0_20px_50px_-40px_rgba(12,74,160,0.55)] transition-all hover:-translate-y-1 hover:shadow-[0_28px_60px_-42px_rgba(12,74,160,0.7)]",
                    "border-[#efe7df] shadow-[0_20px_60px_-46px_rgba(0,0,0,0.16)] hover:shadow-[0_28px_70px_-48px_rgba(0,0,0,0.2)]",
                    isSelected && "border-[#FF912C] ring-2 ring-[#FF912C]/10",
                    !isAvailable && "opacity-50"
                  )}
                  onClick={() => isAvailable && handleCategorySelect(cat.categoryId)}
                >
                  {cat.categoryImageUrl ? (
                    <div className="relative">
                      <img
                        src={cat.categoryImageUrl.startsWith("/") ? cat.categoryImageUrl : getBlobProxyUrl(cat.categoryImageUrl) || cat.categoryImageUrl}
                        alt={cat.categoryName}
                        className="h-32 w-full object-cover"
                      />
                      {!isAvailable ? (
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-[#111111]/78 px-4 py-2 text-center backdrop-blur-sm">
                          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white">
                            {t("booking.unavailableBanner")}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : !isAvailable ? (
                    <div className="border-b border-[#efe7df] bg-[#111111] px-4 py-3 text-center">
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white">
                        {t("booking.unavailableBanner")}
                      </p>
                    </div>
                  ) : null}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-[#111111]">{cat.categoryName}</CardTitle>
                    <CardDescription className="font-semibold text-[#FF912C]">
                      {formatCurrency(cat.dailyRate)} / {t("booking.days").toLowerCase()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {cardBlockedMessage ? (
                        <div className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700">
                          {cardBlockedMessage}
                        </div>
                      ) : !isAvailable ? (
                        <div className="rounded-xl border border-[#efe7df] bg-[#faf8f6] px-3 py-2 text-xs font-medium text-[#57534e]">
                          {t("booking.errors.categoryUnavailable")}
                        </div>
                      ) : null}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#57534e]">{t("booking.baseTotal")}:</span>
                        <span className="font-semibold text-[#111111]">{formatCurrency(cat.baseTotalForRange)}</span>
                      </div>
                      {cat.belowMinimumSurcharge > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-[#57534e]">{t("booking.belowMinimumSurcharge")}:</span>
                          <span className="font-semibold text-[#111111]">{formatCurrency(cat.belowMinimumSurcharge)}</span>
                        </div>
                      )}
                      {cat.lastMinuteSurcharge > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-[#57534e]">{t("booking.lastMinuteSurcharge")}:</span>
                          <span className="font-semibold text-[#111111]">{formatCurrency(cat.lastMinuteSurcharge)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#57534e]">{t("booking.total")}:</span>
                        <span className="font-semibold text-[#111111]">{formatCurrency(cat.totalForRange)}</span>
                      </div>
                      <div className="space-y-1 text-xs text-[#57534e]">
                        <p className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-[#FF912C]" />
                          {(cat.seats ?? 5)} seats
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Settings2 className="h-3.5 w-3.5 text-[#FF912C]" />
                          {cat.transmission === "MANUAL" ? "Manual" : "Automatic"}
                        </p>
                        {(cat.features || []).slice(0, 4).map((feature) => (
                          <p key={feature} className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#FF912C]" />
                            {feature}
                          </p>
                        ))}
                        <p className="flex items-center gap-1.5">
                          <Gauge className="h-3.5 w-3.5 text-[#FF912C]" />
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
          className="h-12 rounded-full bg-[#111111] px-6 font-semibold text-white hover:bg-[#292524]"
        >
          <ArrowRight className="h-4 w-4" />
          {t("booking.continue")}
        </Button>
      </div>

      <MapLocationPickerDialog
        open={activeMapTarget === "pickup"}
        onOpenChange={(open) => setActiveMapTarget(open ? "pickup" : null)}
        value={{
          label: bookingData.pickupCustomPlaceName,
          address: bookingData.pickupCustomAddress,
          latitude: bookingData.pickupCustomLatitude,
          longitude: bookingData.pickupCustomLongitude,
        }}
        title={t("booking.pickPickupOnMap")}
        description={t("booking.mapPickerDescription")}
        searchPlaceholder={t("booking.mapSearchPlaceholder")}
        searchLabel={t("booking.mapSearchAction")}
        currentLocationLabel={t("booking.useCurrentLocation")}
        locatingLabel={t("booking.locatingCurrentLocation")}
        confirmLabel={t("booking.useMarkedLocation")}
        cancelLabel={t("common.cancel")}
        unavailableMessage={t("booking.mapUnavailable")}
        geolocationUnavailableMessage={t("booking.geolocationUnavailable")}
        onConfirm={(value) =>
          updateBookingData({
            pickupCustomAddress: value.address,
            pickupCustomLatitude: value.latitude,
            pickupCustomLongitude: value.longitude,
            pickupCustomPlaceName: bookingData.pickupCustomPlaceName || value.label,
          })
        }
      />

      <MapLocationPickerDialog
        open={activeMapTarget === "dropoff"}
        onOpenChange={(open) => setActiveMapTarget(open ? "dropoff" : null)}
        value={{
          label: bookingData.dropoffCustomPlaceName,
          address: bookingData.dropoffCustomAddress,
          latitude: bookingData.dropoffCustomLatitude,
          longitude: bookingData.dropoffCustomLongitude,
        }}
        title={t("booking.pickDropoffOnMap")}
        description={t("booking.mapPickerDescription")}
        searchPlaceholder={t("booking.mapSearchPlaceholder")}
        searchLabel={t("booking.mapSearchAction")}
        currentLocationLabel={t("booking.useCurrentLocation")}
        locatingLabel={t("booking.locatingCurrentLocation")}
        confirmLabel={t("booking.useMarkedLocation")}
        cancelLabel={t("common.cancel")}
        unavailableMessage={t("booking.mapUnavailable")}
        geolocationUnavailableMessage={t("booking.geolocationUnavailable")}
        onConfirm={(value) =>
          updateBookingData({
            dropoffCustomAddress: value.address,
            dropoffCustomLatitude: value.latitude,
            dropoffCustomLongitude: value.longitude,
            dropoffCustomPlaceName: bookingData.dropoffCustomPlaceName || value.label,
          })
        }
      />
    </div>
  );
}

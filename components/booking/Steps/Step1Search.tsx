"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { searchAvailabilityAction, AvailabilityResult } from "@/actions/availability";
import { calculateDays, formatCurrency } from "@/lib/pricing";
import { BookingData } from "../BookingWizard";

interface Step1SearchProps {
  bookingData: BookingData;
  updateBookingData: (updates: Partial<BookingData>) => void;
  onNext: () => void;
  disabled: boolean;
  setAvailability: (availability: AvailabilityResult[]) => void;
  availability: AvailabilityResult[];
}

export function Step1Search({ bookingData, updateBookingData, onNext, disabled, setAvailability, availability }: Step1SearchProps) {
  const t = useTranslations();
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!bookingData.startDate || !bookingData.endDate) return;

    setIsSearching(true);
    try {
      const results = await searchAvailabilityAction(bookingData.startDate, bookingData.endDate);
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

  const canContinue = bookingData.categoryId && availability.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">{t("booking.selectDateRange")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t("booking.startDate")}</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !bookingData.startDate && "text-muted-foreground"
                  )}
                  disabled={disabled}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {bookingData.startDate ? format(bookingData.startDate, "PPP") : t("booking.selectDateRange")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={bookingData.startDate || undefined}
                  onSelect={(date) => updateBookingData({ startDate: date || null })}
                  disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t("booking.endDate")}</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !bookingData.endDate && "text-muted-foreground"
                  )}
                  disabled={disabled}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {bookingData.endDate ? format(bookingData.endDate, "PPP") : t("booking.selectDateRange")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={bookingData.endDate || undefined}
                  onSelect={(date) => updateBookingData({ endDate: date || null })}
                  disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="mt-4">
          <Button
            onClick={handleSearch}
            disabled={!bookingData.startDate || !bookingData.endDate || isSearching || disabled}
            className="w-full"
          >
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
              const days = bookingData.startDate && bookingData.endDate ? calculateDays(bookingData.startDate, bookingData.endDate) : 1;

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
          {t("booking.continue")}
        </Button>
      </div>
    </div>
  );
}
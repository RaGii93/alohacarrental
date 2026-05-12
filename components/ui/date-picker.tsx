"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type DatePickerProps = {
  id?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder: string;
  disabled?: boolean;
  className?: string;
  fromYear?: number;
  toYear?: number;
  disabledDate?: (date: Date) => boolean;
  minDate?: Date;
  maxDate?: Date;
  hideIcon?: boolean;
};

export function DatePicker({
  id,
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  fromYear,
  toYear,
  disabledDate,
  minDate,
  maxDate,
  hideIcon = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const today = React.useMemo(() => new Date(), []);
  const resolvedFromYear = React.useMemo(() => {
    if (typeof fromYear === "number") return fromYear;
    if (minDate) return minDate.getFullYear();
    return today.getFullYear() - 100;
  }, [fromYear, minDate, today]);
  const resolvedToYear = React.useMemo(() => {
    if (typeof toYear === "number") return toYear;
    if (maxDate) return maxDate.getFullYear();
    return today.getFullYear() + 10;
  }, [toYear, maxDate, today]);
  const resolvedDisabledDate = React.useCallback(
    (date: Date) => {
      if (disabledDate?.(date)) return true;
      if (minDate && date < minDate) return true;
      if (maxDate && date > maxDate) return true;
      return false;
    },
    [disabledDate, minDate, maxDate]
  );

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-12 w-full justify-start rounded-xl border-[#ece7e2] bg-white px-4 text-left text-base font-medium text-[#111111] shadow-none hover:bg-[#fffaf8]",
            !value && "text-muted-foreground",
            className
          )}
        >
          {!hideIcon && <CalendarIcon className="mr-3 h-4 w-4 text-[#FF912C]" />}
          {value ? format(value, "MMM d, yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={10}
        collisionPadding={16}
        className="z-[80] isolate w-[min(24rem,calc(100vw-2rem))] rounded-[1.5rem] border border-[#eadfd8] bg-white p-0 opacity-100 shadow-[0_32px_80px_-40px_rgba(17,17,17,0.12)]"
      >
        <Calendar
          className="w-full"
          mode="single"
          captionLayout="dropdown"
          showOutsideDays={false}
          selected={value ?? undefined}
          onSelect={(date) => {
            onChange(date ?? null);
            if (date) setOpen(false);
          }}
          fromYear={resolvedFromYear}
          toYear={resolvedToYear}
          disabled={resolvedDisabledDate}
          fixedWeeks
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

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
  hideIcon = true,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          {!hideIcon && <CalendarIcon className="mr-2 h-4 w-4" />}
          {value ? format(value, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={10}
        collisionPadding={16}
        className="z-[80] w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-[1.25rem] border border-[#d7e4f8] bg-white p-0 shadow-[0_28px_65px_-38px_rgba(12,74,160,0.45)]"
      >
        <Calendar
          className="w-full border-0 bg-transparent p-3 shadow-none"
          mode="single"
          captionLayout="dropdown"
          showOutsideDays={false}
          selected={value ?? undefined}
          onSelect={(date) => {
            onChange(date ?? null);
            if (date) setOpen(false);
          }}
          fromYear={fromYear}
          toYear={toYear}
          disabled={disabledDate}
          fixedWeeks
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

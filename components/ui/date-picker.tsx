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
  return (
    <Popover>
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
      <PopoverContent className="z-50 w-[21rem] p-2" align="start">
        <Calendar
          className="w-full"
          mode="single"
          captionLayout="dropdown"
          selected={value ?? undefined}
          onSelect={(date) => onChange(date ?? null)}
          fromYear={fromYear}
          toYear={toYear}
          disabled={disabledDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

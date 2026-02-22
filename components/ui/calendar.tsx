"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "dropdown",
  fromYear,
  toYear,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const currentYear = new Date().getFullYear();
  const defaultClassNames = getDefaultClassNames();
  const isDropdownCaption = captionLayout?.toString().includes("dropdown");

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      fromYear={fromYear ?? currentYear - 100}
      toYear={toYear ?? currentYear + 20}
      className={cn("p-3", className)}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("flex flex-col sm:flex-row gap-4", defaultClassNames.months),
        month: cn("space-y-4", defaultClassNames.month),
        month_caption: cn("relative flex items-center justify-center pt-1", defaultClassNames.month_caption),
        caption_label: cn(isDropdownCaption ? "sr-only" : "text-sm font-medium", defaultClassNames.caption_label),
        nav: cn("absolute inset-y-0 left-0 right-0 flex items-center justify-between", defaultClassNames.nav),
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100",
          defaultClassNames.button_next
        ),
        dropdowns: cn("flex items-center gap-2", defaultClassNames.dropdowns),
        dropdown_root: cn("rounded-md border border-input bg-background", defaultClassNames.dropdown_root),
        dropdown: cn("h-8 rounded-md bg-background px-2 text-sm", defaultClassNames.dropdown),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "h-9 w-9 text-center text-[0.8rem] font-normal text-muted-foreground",
          defaultClassNames.weekday
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        day: cn("h-9 w-9 p-0 text-center text-sm", defaultClassNames.day),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
          defaultClassNames.day_button
        ),
        selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        range_start: "rounded-l-md",
        range_end: "rounded-r-md",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className, ...iconProps }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("h-4 w-4", className)} {...iconProps} />
          ) : (
            <ChevronRight className={cn("h-4 w-4", className)} {...iconProps} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };

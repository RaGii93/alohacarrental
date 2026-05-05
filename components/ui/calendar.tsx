"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "rounded-[1.35rem] border border-[#ebe5e1] bg-white p-3.5 shadow-[0_24px_60px_-38px_rgba(17,17,17,0.12)]",
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-full", defaultClassNames.root),
        months: cn("relative", defaultClassNames.months),
        month: cn("space-y-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex items-center justify-between",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "size-8 rounded-full border-[#ebe5e1] bg-white text-[#FF912C] shadow-none hover:border-[#d9d1cc] hover:bg-[#f8f6f4] hover:text-[#E67F1F]",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "size-8 rounded-full border-[#ebe5e1] bg-white text-[#FF912C] shadow-none hover:border-[#d9d1cc] hover:bg-[#f8f6f4] hover:text-[#E67F1F]",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-8 items-center justify-center px-10",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex items-center gap-2",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative rounded-full border border-[#ebe5e1] bg-white px-3 text-[#221815] shadow-none",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute inset-0 opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "flex h-8 items-center gap-1 rounded-full px-2 text-sm font-semibold text-[#221815]",
          defaultClassNames.caption_label
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn(defaultClassNames.weekdays),
        weekday: cn(
          "h-10 w-10 px-0 text-center text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-[#8b8079]",
          defaultClassNames.weekday
        ),
        weeks: cn(defaultClassNames.weeks),
        week: cn(defaultClassNames.week),
        day: cn(
          "h-10 w-10 p-0 text-center align-middle",
          defaultClassNames.day
        ),
        day_button: cn(
          "h-10 w-10 rounded-xl border border-transparent bg-transparent text-sm font-medium text-[#221815] shadow-none transition-all focus-visible:ring-2 focus-visible:ring-[#FFD9A8]",
          defaultClassNames.day_button
        ),
        selected: cn(defaultClassNames.selected),
        today: cn(defaultClassNames.today),
        outside: cn(
          "text-[#d5cbc6] opacity-35",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-[#d0c6c0] opacity-35",
          defaultClassNames.disabled
        ),
        range_start: cn(
          "rounded-l-xl rounded-r-md border-[#FF912C] bg-[#FF912C] text-white hover:bg-[#E67F1F] hover:text-white",
          defaultClassNames.range_start
        ),
        range_middle: cn(
          "rounded-none border-y border-[#FFE8CC] bg-[#FFF4E6] text-[#a05c00]",
          defaultClassNames.range_middle
        ),
        range_end: cn(
          "rounded-r-xl rounded-l-md border-[#FF912C] bg-[#FF912C] text-white hover:bg-[#E67F1F] hover:text-white",
          defaultClassNames.range_end
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon className={cn("size-4", className)} {...props} />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()
  const ref = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (modifiers.focused) {
      ref.current?.focus()
    }
  }, [modifiers.focused])

  return (
    <button
      ref={ref}
      type="button"
      data-day={day.date.toLocaleDateString()}
      data-selected={modifiers.selected}
      data-disabled={modifiers.disabled}
      data-today={modifiers.today}
      data-outside={modifiers.outside}
      data-range-start={modifiers.range_start}
      data-range-middle={modifiers.range_middle}
      data-range-end={modifiers.range_end}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-transparent bg-white text-sm font-medium text-[#221815] shadow-none transition-[background-color,border-color,color,box-shadow] hover:border-[#e7dfda] hover:bg-[#f7f5f3] hover:text-[#111111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD9A8] focus-visible:ring-offset-2 focus-visible:ring-offset-white data-[today=true]:border-[#FFD9A8] data-[today=true]:bg-[#FFF4E6] data-[today=true]:text-[#E67F1F] data-[today=true]:shadow-[inset_0_0_0_1px_rgba(255,145,44,0.15)] data-[selected=true]:border-[#FF912C] data-[selected=true]:bg-[#FF912C] data-[selected=true]:text-white data-[selected=true]:shadow-[0_12px_28px_-18px_rgba(255,145,44,0.55)] data-[selected=true]:hover:border-[#E67F1F] data-[selected=true]:hover:bg-[#E67F1F] data-[selected=true]:hover:text-white data-[disabled=true]:cursor-not-allowed data-[disabled=true]:border-transparent data-[disabled=true]:bg-transparent data-[disabled=true]:text-[#cdbfb8] data-[disabled=true]:opacity-1 data-[disabled=true]:shadow-none data-[disabled=true]:hover:border-transparent data-[disabled=true]:hover:bg-transparent data-[disabled=true]:hover:text-[#cdbfb8] data-[outside=true]:text-[#d5cbc6] data-[outside=true]:opacity-35 data-[outside=true]:hover:border-transparent data-[outside=true]:hover:bg-transparent data-[outside=true]:hover:text-[#d5cbc6] data-[range-middle=true]:rounded-none data-[range-middle=true]:border-y data-[range-middle=true]:border-[#FFE8CC] data-[range-middle=true]:bg-[#FFF4E6] data-[range-middle=true]:text-[#a05c00] data-[range-start=true]:rounded-l-xl data-[range-start=true]:rounded-r-md data-[range-start=true]:border-[#FF912C] data-[range-start=true]:bg-[#FF912C] data-[range-start=true]:text-white data-[range-end=true]:rounded-l-md data-[range-end=true]:rounded-r-xl data-[range-end=true]:border-[#FF912C] data-[range-end=true]:bg-[#FF912C] data-[range-end=true]:text-white",
        defaultClassNames.day_button,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }

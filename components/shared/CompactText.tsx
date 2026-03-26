"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type CompactTextProps = {
  text: string | null | undefined;
  emptyText?: string;
  className?: string;
  widthClassName?: string;
  expandedTitle?: string;
};

export function CompactText({
  text,
  emptyText = "-",
  className,
  widthClassName = "max-w-[22rem]",
  expandedTitle = "Full text",
}: CompactTextProps) {
  const value = String(text || "").trim();
  if (!value) return <span>{emptyText}</span>;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={value}
          className={cn(
            "block text-left text-sm leading-6 text-inherit outline-none",
            "line-clamp-2 break-words rounded-md focus-visible:ring-2 focus-visible:ring-ring/50",
            widthClassName,
            className
          )}
        >
          {value}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-w-md rounded-2xl p-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {expandedTitle}
          </p>
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
            {value}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

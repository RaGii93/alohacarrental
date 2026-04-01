"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type AccordionContextValue = {
  value: string | null;
  setValue: (value: string) => void;
  collapsible: boolean;
};

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

type AccordionItemContextValue = {
  value: string;
  open: boolean;
};

const AccordionItemContext = React.createContext<AccordionItemContextValue | null>(null);

export function Accordion({
  children,
  className,
  defaultValue = null,
  collapsible = true,
}: {
  children: React.ReactNode;
  className?: string;
  defaultValue?: string | null;
  collapsible?: boolean;
}) {
  const [value, setValueState] = React.useState<string | null>(defaultValue);

  const setValue = React.useEffectEvent((nextValue: string) => {
    setValueState((currentValue) => {
      if (currentValue === nextValue) {
        return collapsible ? null : currentValue;
      }

      return nextValue;
    });
  });

  return (
    <AccordionContext.Provider value={{ value, setValue, collapsible }}>
      <div className={cn("space-y-4", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({
  children,
  className,
  value,
}: {
  children: React.ReactNode;
  className?: string;
  value: string;
}) {
  const accordion = React.useContext(AccordionContext);

  if (!accordion) {
    throw new Error("AccordionItem must be used within Accordion");
  }

  const open = accordion.value === value;

  return (
    <AccordionItemContext.Provider value={{ value, open }}>
      <div
        data-state={open ? "open" : "closed"}
        className={cn(
          "overflow-hidden rounded-[1.6rem] border border-[rgba(15,39,64,0.08)] bg-white/88 shadow-[0_20px_50px_-34px_rgba(15,39,64,0.18)] ring-1 ring-white/70 backdrop-blur-md transition-all",
          open && "border-[rgba(19,120,152,0.18)] bg-white shadow-[0_28px_72px_-38px_rgba(19,120,152,0.24)]",
          className
        )}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const accordion = React.useContext(AccordionContext);
  const item = React.useContext(AccordionItemContext);

  if (!accordion || !item) {
    throw new Error("AccordionTrigger must be used within AccordionItem");
  }

  return (
    <button
      type="button"
      aria-expanded={item.open}
      onClick={() => accordion.setValue(item.value)}
      className={cn(
        "flex w-full items-center justify-between gap-6 px-6 py-5 text-left transition-colors hover:bg-[rgba(19,120,152,0.04)] sm:px-7",
        className
      )}
    >
      <span className="text-base font-semibold text-[hsl(var(--foreground))] sm:text-lg">{children}</span>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full border border-[rgba(19,120,152,0.14)] bg-[rgba(19,120,152,0.08)] text-[rgb(19,120,152)] shadow-[0_12px_24px_-20px_rgba(19,120,152,0.22)] transition-transform duration-200",
          item.open && "rotate-180 border-[rgb(19,120,152)] bg-[rgb(19,120,152)] text-white"
        )}
      >
        <ChevronDown className="size-5" />
      </span>
    </button>
  );
}

export function AccordionContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const item = React.useContext(AccordionItemContext);

  if (!item) {
    throw new Error("AccordionContent must be used within AccordionItem");
  }

  if (!item.open) {
    return null;
  }

  return (
    <div className={cn("border-t border-[rgba(15,39,64,0.08)] px-6 pb-6 pt-4 sm:px-7", className)}>
      {children}
    </div>
  );
}

import type { BookingRuleSettings, BelowMinimumRentalSurchargeMode } from "@/lib/settings";

/**
 * Calculate the number of days between two dates (endDate exclusive)
 */
export function calculateDays(startDate: Date, endDate: Date): number {
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

/**
 * Format cents to currency string
 */
export function formatCurrency(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function calculatePercentageAmount(amountCents: number, percentage: number): number {
  return Math.max(0, Math.round(Math.max(0, amountCents) * (Math.max(0, percentage) / 100)));
}

export type BookingSource = "public" | "admin";

export type BookingRuleEvaluation = {
  days: number;
  baseTotalCents: number;
  extrasTotalCents: number;
  hoursUntilStart: number;
  isBelowMinimumRental: boolean;
  isLastMinuteBooking: boolean;
  belowMinimumBlocked: boolean;
  lastMinuteBlocked: boolean;
  belowMinimumSurchargeCents: number;
  lastMinuteSurchargeCents: number;
  subtotalBeforeTaxCents: number;
  taxAmountCents: number;
  totalAmountCents: number;
  appliedRules: Array<"below_minimum" | "last_minute">;
};

function applyBelowMinimumSurchargeMode(params: {
  mode: BelowMinimumRentalSurchargeMode;
  value: number;
  baseTotalCents: number;
  currentSubtotalCents: number;
}) {
  if (params.value <= 0) return 0;
  if (params.mode === "fixed_amount") {
    return Math.max(0, Math.round(params.value));
  }
  if (params.mode === "percentage_on_current_total") {
    return calculatePercentageAmount(params.currentSubtotalCents, params.value);
  }
  return calculatePercentageAmount(params.baseTotalCents, params.value);
}

export function evaluateBookingRules(params: {
  startDate: Date;
  endDate: Date;
  basePriceCents: number;
  extrasCents?: number;
  taxPercentage?: number;
  baseRentalIncludesTax?: boolean;
  bookingSource: BookingSource;
  settings: BookingRuleSettings;
  now?: Date;
}) : BookingRuleEvaluation {
  const days = calculateDays(params.startDate, params.endDate);
  const baseTotalCents = Math.max(0, Math.round(params.basePriceCents)) * days;
  const extrasTotalCents = Math.max(0, Math.round(params.extrasCents || 0));
  const now = params.now ?? new Date();
  const hoursUntilStart = (params.startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isBelowMinimumRental = days < params.settings.minimumRentalDays;
  const isLastMinuteBooking =
    params.settings.lastMinuteBookingEnabled &&
    hoursUntilStart >= 0 &&
    hoursUntilStart <= params.settings.lastMinuteBookingThresholdHours;

  const belowMinimumBlocked = isBelowMinimumRental && params.settings.belowMinimumRentalAdminOnly && params.bookingSource === "public";
  const lastMinuteBlocked = isLastMinuteBooking && params.settings.lastMinuteBookingAdminOnly && params.bookingSource === "public";

  let currentSubtotalCents = baseTotalCents + extrasTotalCents;
  const appliedRules: Array<"below_minimum" | "last_minute"> = [];

  const belowMinimumSurchargeCents =
    isBelowMinimumRental && params.settings.belowMinimumRentalPricingEnabled
      ? applyBelowMinimumSurchargeMode({
          mode: params.settings.belowMinimumRentalSurchargeMode,
          value: params.settings.belowMinimumRentalSurchargeValue,
          baseTotalCents,
          currentSubtotalCents,
        })
      : 0;

  if (belowMinimumSurchargeCents > 0) {
    currentSubtotalCents += belowMinimumSurchargeCents;
    appliedRules.push("below_minimum");
  }

  const lastMinuteSurchargeCents =
    isLastMinuteBooking && params.settings.lastMinuteBookingExtraPercent > 0
      ? calculatePercentageAmount(currentSubtotalCents, params.settings.lastMinuteBookingExtraPercent)
      : 0;

  if (lastMinuteSurchargeCents > 0) {
    currentSubtotalCents += lastMinuteSurchargeCents;
    appliedRules.push("last_minute");
  }

  const pricing = calculateBookingAmounts({
    baseRentalCents: baseTotalCents + belowMinimumSurchargeCents + lastMinuteSurchargeCents,
    extrasCents: extrasTotalCents,
    taxPercentage: params.taxPercentage ?? 0,
    baseRentalIncludesTax: params.baseRentalIncludesTax,
  });

  return {
    days,
    baseTotalCents,
    extrasTotalCents,
    hoursUntilStart,
    isBelowMinimumRental,
    isLastMinuteBooking,
    belowMinimumBlocked,
    lastMinuteBlocked,
    belowMinimumSurchargeCents,
    lastMinuteSurchargeCents,
    subtotalBeforeTaxCents: pricing.subtotalBeforeTax,
    taxAmountCents: pricing.taxAmount,
    totalAmountCents: pricing.totalAmount,
    appliedRules,
  };
}

export function calculateBookingAmounts(params: {
  baseRentalCents: number;
  extrasCents: number;
  taxPercentage: number;
  discountCents?: number;
  baseRentalIncludesTax?: boolean;
}) {
  const baseRentalCents = Math.max(0, params.baseRentalCents);
  const extrasCents = Math.max(0, params.extrasCents);
  const discountCents = Math.max(0, params.discountCents || 0);
  const discountedBaseRentalCents = Math.max(0, baseRentalCents - discountCents);
  const subtotalBeforeTax = discountedBaseRentalCents + extrasCents;
  const taxableAmountCents = params.baseRentalIncludesTax
    ? extrasCents
    : discountedBaseRentalCents + extrasCents;
  const taxAmount = calculatePercentageAmount(taxableAmountCents, params.taxPercentage);
  const totalAmount = subtotalBeforeTax + taxAmount;

  return {
    discountedBaseRentalCents,
    subtotalBeforeTax,
    taxableAmountCents,
    taxAmount,
    totalAmount,
  };
}

/**
 * Calculate total amount in cents
 */
export function calculateTotalAmount(dailyRateCents: number, days: number): number {
  return dailyRateCents * days;
}

export const FUEL_LEVEL_OPTIONS = [
  { value: 0, label: "Empty" },
  { value: 1, label: "1/4" },
  { value: 2, label: "1/2" },
  { value: 3, label: "3/4" },
  { value: 4, label: "Full" },
] as const;

export const DEFAULT_FUEL_CHARGE_PER_QUARTER_CENTS = 2500;

export function getFuelChargePerQuarterForCategory(
  category: { fuelChargePerQuarter?: number | null } | null | undefined
): number {
  return Math.max(0, Number(category?.fuelChargePerQuarter ?? DEFAULT_FUEL_CHARGE_PER_QUARTER_CENTS) || 0);
}

export const LATE_RETURN_GRACE_HOURS = 4;

export function calculateLateReturnCharge(params: {
  scheduledDropoffAt: Date | string;
  actualReturnedAt: Date | string;
  dailyRateCents: number;
  graceHours?: number;
}) {
  const scheduled = new Date(params.scheduledDropoffAt);
  const actual = new Date(params.actualReturnedAt);
  const dailyRateCents = Math.max(0, Math.round(params.dailyRateCents || 0));
  const graceMs = Math.max(0, params.graceHours ?? LATE_RETURN_GRACE_HOURS) * 60 * 60 * 1000;
  const lateMs = actual.getTime() - scheduled.getTime();

  if (!Number.isFinite(lateMs) || lateMs <= graceMs || dailyRateCents <= 0) {
    return {
      isLate: lateMs > 0,
      lateMs: Math.max(0, lateMs),
      lateDays: 0,
      chargeCents: 0,
    };
  }

  const chargeableLateMs = lateMs - graceMs;
  const lateDays = Math.max(1, Math.ceil(chargeableLateMs / (1000 * 60 * 60 * 24)));

  return {
    isLate: true,
    lateMs,
    lateDays,
    chargeCents: lateDays * dailyRateCents,
  };
}

export function getFuelLevelLabel(level: number | null | undefined): string {
  return FUEL_LEVEL_OPTIONS.find((option) => option.value === level)?.label || "-";
}

export function calculateFuelDifferenceCharge(params: {
  pickupFuelLevel: number | null | undefined;
  returnFuelLevel: number | null | undefined;
  chargePerQuarterCents?: number;
}) {
  const pickup = Number.isFinite(params.pickupFuelLevel as number) ? Math.max(0, Math.min(4, Number(params.pickupFuelLevel))) : 0;
  const returned = Number.isFinite(params.returnFuelLevel as number) ? Math.max(0, Math.min(4, Number(params.returnFuelLevel))) : 0;
  const missingQuarters = Math.max(0, pickup - returned);
  const chargePerQuarterCents = Math.max(0, params.chargePerQuarterCents ?? DEFAULT_FUEL_CHARGE_PER_QUARTER_CENTS);
  const chargeCents = missingQuarters * chargePerQuarterCents;

  return {
    missingQuarters,
    chargeCents,
  };
}

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

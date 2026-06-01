import { calculatePercentageAmount, type BookingSource } from "@/lib/pricing";

export const FULL_INSURANCE_PERCENT = 7;
export const FULL_INSURANCE_MIN_DAYS = 5;

const FULL_INSURANCE_NAME_PATTERNS = [
  /full\s*insurance/i,
  /seguro\s*completo/i,
  /volledige\s*verzekering/i,
];

export function isFullInsuranceExtraName(name: string | null | undefined) {
  const normalized = String(name || "").trim();
  if (!normalized) return false;
  return FULL_INSURANCE_NAME_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function computeExtraLineTotal(params: {
  extraName: string;
  pricingType: "DAILY" | "FLAT";
  amountCents: number;
  quantity: number;
  days: number;
  baseTotalCents: number;
}) {
  const quantity = Math.max(1, Math.round(params.quantity || 1));
  const days = Math.max(1, Math.round(params.days || 1));

  if (isFullInsuranceExtraName(params.extraName)) {
    return calculatePercentageAmount(params.baseTotalCents, FULL_INSURANCE_PERCENT) * quantity;
  }

  const amountCents = Math.max(0, Math.round(params.amountCents || 0));
  if (params.pricingType === "DAILY") {
    return amountCents * days * quantity;
  }
  return amountCents * quantity;
}

export function hasIneligibleFullInsuranceSelection(params: {
  days: number;
  selectedExtras: Array<{ name: string }>;
}) {
  if (Math.max(1, params.days) >= FULL_INSURANCE_MIN_DAYS) return false;
  return params.selectedExtras.some((extra) => isFullInsuranceExtraName(extra.name));
}

export function resolveCategoryDailyRate(params: {
  dailyRateCents: number;
  cruiseDailyRateCents?: number | null;
  bookingSource: BookingSource;
  isCruise?: boolean;
}) {
  const normalRate = Math.max(0, Math.round(params.dailyRateCents || 0));
  if (params.bookingSource !== "admin" || !params.isCruise) {
    return normalRate;
  }

  const cruiseRate = Math.max(0, Math.round(params.cruiseDailyRateCents || 0));
  if (cruiseRate <= 0) return normalRate + 1;

  // Cruise bookings must always be more expensive than normal bookings.
  return Math.max(normalRate + 1, cruiseRate);
}

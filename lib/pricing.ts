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

/**
 * Calculate total amount in cents
 */
export function calculateTotalAmount(dailyRateCents: number, days: number): number {
  return dailyRateCents * days;
}
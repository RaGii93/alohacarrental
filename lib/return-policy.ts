import { parseLaPazDateTimeInput } from "@/lib/timezone";

export function resolveActualReturnTime(input: {
  value?: string;
  startDate: Date;
  deliveredAt?: Date | null;
  now?: Date;
}): Date {
  const now = input.now || new Date();
  const returnedAt = input.value ? parseLaPazDateTimeInput(input.value) : now;
  if (!returnedAt || Number.isNaN(returnedAt.getTime())) throw new Error("Invalid return date/time");
  if (returnedAt > now) throw new Error("Return date/time cannot be in the future");
  if (returnedAt < input.startDate || (input.deliveredAt && returnedAt < input.deliveredAt)) {
    throw new Error("Return date/time cannot be before pickup");
  }
  return returnedAt;
}

export function resolveReturnCharges(input: {
  keepAgreedPrice?: boolean;
  lateCharge: number;
  fuelCharge: number;
  damageCharge: number;
}) {
  const lateCharge = input.keepAgreedPrice ? 0 : input.lateCharge;
  const fuelCharge = input.keepAgreedPrice ? 0 : input.fuelCharge;
  const damageCharge = input.keepAgreedPrice ? 0 : input.damageCharge;
  for (const amount of [lateCharge, fuelCharge, damageCharge]) {
    if (!Number.isSafeInteger(amount) || amount < 0) throw new Error("Invalid return charges");
  }
  return { lateCharge, fuelCharge, damageCharge, totalAdjustment: lateCharge + fuelCharge + damageCharge };
}

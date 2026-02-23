"use server";

import { getSession } from "@/lib/session";
import {
  getMinBookingDays,
  getTaxPercentage,
  setMinBookingDays,
  setTaxPercentage,
} from "@/lib/settings";

export async function getTaxSettingsAction() {
  try {
    const taxPercentage = await getTaxPercentage();
    return { success: true as const, taxPercentage };
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to load tax settings" };
  }
}

export async function updateTaxPercentageAction(taxPercentage: number, _locale: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false as const, error: "Unauthorized" };
    if (session.role !== "ROOT" && session.role !== "OWNER") {
      return { success: false as const, error: "Forbidden" };
    }

    const value = await setTaxPercentage(taxPercentage);
    return { success: true as const, taxPercentage: value };
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to update tax percentage" };
  }
}

export async function getSystemSettingsAction() {
  try {
    const [taxPercentage, minimumBookingDays] = await Promise.all([
      getTaxPercentage(),
      getMinBookingDays(),
    ]);
    return { success: true as const, taxPercentage, minimumBookingDays };
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to load settings" };
  }
}

export async function updateMinimumBookingDaysAction(minimumBookingDays: number, _locale: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false as const, error: "Unauthorized" };
    if (session.role !== "ROOT" && session.role !== "OWNER") {
      return { success: false as const, error: "Forbidden" };
    }

    const value = await setMinBookingDays(minimumBookingDays);
    return { success: true as const, minimumBookingDays: value };
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to update minimum booking days" };
  }
}

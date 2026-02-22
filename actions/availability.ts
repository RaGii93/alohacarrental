"use server";

import { db } from "@/lib/db";
import { cancelExpiredHolds } from "./booking";

export interface AvailabilityResult {
  categoryId: string;
  categoryName: string;
  dailyRate: number;
  availableCount: number;
  totalForRange: number;
}

export async function searchAvailabilityAction(
  startDate: Date,
  endDate: Date
): Promise<AvailabilityResult[]> {
  // Cancel expired holds first
  await cancelExpiredHolds();

  // Get all active categories
  const categories = await db.vehicleCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const results: AvailabilityResult[] = [];

  for (const category of categories) {
    // Count total active vehicles in this category
    const totalVehicles = await db.vehicle.count({
      where: {
        categoryId: category.id,
        status: "ACTIVE",
      },
    });

    // Count overlapping bookings for this category
    const overlappingBookings = await db.booking.count({
      where: {
        categoryId: category.id,
        startDate: { lt: endDate },
        endDate: { gt: startDate },
        status: { in: ["PENDING", "CONFIRMED"] },
        holdExpiresAt: { gt: new Date() },
      },
    });

    const availableCount = Math.max(0, totalVehicles - overlappingBookings);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalForRange = category.dailyRate * Math.max(1, days);

    results.push({
      categoryId: category.id,
      categoryName: category.name,
      dailyRate: category.dailyRate,
      availableCount,
      totalForRange,
    });
  }

  return results;
}
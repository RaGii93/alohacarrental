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

  // Some runtime environments may not expose the generated model accessor (db.vehicleCategory)
  // fall back to a raw query if it's not available to avoid TypeError on server.
  let categories: Array<any> = [];
  if ((db as any).vehicleCategory && typeof (db as any).vehicleCategory.findMany === "function") {
    categories = await (db as any).vehicleCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  } else {
    // raw query fallback
    categories = await db.$queryRaw<Array<any>>`\
      SELECT id, name, description, "dailyRate", "isActive", "sortOrder", "createdAt"\
      FROM "VehicleCategory"\
      WHERE "isActive" = true\
      ORDER BY "sortOrder" ASC\
    `;
  }

  const results: AvailabilityResult[] = [];

  for (const category of categories) {
    // Count total active vehicles in this category. Try new schema (categoryId) first,
    // fall back to legacy 'category' string column or raw SQL if client schema differs.
    let totalVehicles = 0;
    try {
      totalVehicles = await db.vehicle.count({
        where: { categoryId: category.id, status: "ACTIVE" },
      });
    } catch (e) {
      try {
        // fallback to legacy string category field
        totalVehicles = await db.vehicle.count({
          where: { category: category.name, status: "ACTIVE" },
        });
      } catch (e2) {
        // final fallback: raw query
        const res: Array<{ count: number }> = await db.$queryRaw`
          SELECT COUNT(*)::int as count FROM "Vehicle" WHERE "status" = 'ACTIVE' AND (
            COALESCE("categoryId", '') = ${category.id} OR COALESCE("category", '') = ${category.name}
          )
        ` as any;
        totalVehicles = res?.[0]?.count ?? 0;
      }
    }

    // Count overlapping bookings for this category (prefer categoryId, else join via vehicle)
    let overlappingBookings = 0;
    try {
      overlappingBookings = await db.booking.count({
        where: {
          categoryId: category.id,
          startDate: { lt: endDate },
          endDate: { gt: startDate },
          status: { in: ["PENDING", "CONFIRMED"] },
          holdExpiresAt: { gt: new Date() },
        },
      });
    } catch (err) {
      try {
        // fallback: count bookings where related vehicle has matching category string
        overlappingBookings = await db.booking.count({
          where: {
            startDate: { lt: endDate },
            endDate: { gt: startDate },
            status: { in: ["PENDING", "CONFIRMED"] },
            vehicle: {
              category: category.name,
              status: "ACTIVE",
            },
            holdExpiresAt: { gt: new Date() },
          },
        });
      } catch (err2) {
        // raw SQL fallback joining bookings and vehicles
        const res2: Array<{ count: number }> = await db.$queryRaw`
          SELECT COUNT(b.id)::int as count
          FROM "Booking" b
          LEFT JOIN "Vehicle" v ON v.id = b."vehicleId"
          WHERE b."startDate" < ${endDate}
            AND b."endDate" > ${startDate}
            AND b.status IN ('PENDING','CONFIRMED')
            AND b."holdExpiresAt" > now()
            AND (COALESCE(v."categoryId", '') = ${category.id} OR COALESCE(v."category", '') = ${category.name})
        ` as any;
        overlappingBookings = res2?.[0]?.count ?? 0;
      }
    }

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
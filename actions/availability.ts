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
  const vehicleColumns = await db.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Vehicle'
  `;
  const bookingColumns = await db.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Booking'
  `;

  const hasVehicleCategoryId = vehicleColumns.some((column) => column.column_name === "categoryId");
  const hasVehicleCategory = vehicleColumns.some((column) => column.column_name === "category");
  const hasBookingCategoryId = bookingColumns.some((column) => column.column_name === "categoryId");

  for (const category of categories) {
    let totalVehicles = 0;
    if (hasVehicleCategoryId) {
      const rows = await db.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int AS count
        FROM "Vehicle"
        WHERE "status" = 'ACTIVE' AND "categoryId" = ${category.id}
      `;
      totalVehicles = rows?.[0]?.count ?? 0;
    } else if (hasVehicleCategory) {
      const rows = await db.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int AS count
        FROM "Vehicle"
        WHERE "status" = 'ACTIVE' AND "category" = ${category.name}
      `;
      totalVehicles = rows?.[0]?.count ?? 0;
    }

    let overlappingBookings = 0;
    if (hasBookingCategoryId) {
      const rows = await db.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int AS count
        FROM "Booking"
        WHERE "startDate" < ${endDate}
          AND "endDate" > ${startDate}
          AND "status" IN ('PENDING', 'CONFIRMED')
          AND "holdExpiresAt" > now()
          AND "categoryId" = ${category.id}
      `;
      overlappingBookings = rows?.[0]?.count ?? 0;
    } else if (hasVehicleCategoryId) {
      const rows = await db.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(b.id)::int AS count
        FROM "Booking" b
        JOIN "Vehicle" v ON v.id = b."vehicleId"
        WHERE b."startDate" < ${endDate}
          AND b."endDate" > ${startDate}
          AND b."status" IN ('PENDING', 'CONFIRMED')
          AND b."holdExpiresAt" > now()
          AND v."status" = 'ACTIVE'
          AND v."categoryId" = ${category.id}
      `;
      overlappingBookings = rows?.[0]?.count ?? 0;
    } else if (hasVehicleCategory) {
      const rows = await db.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(b.id)::int AS count
        FROM "Booking" b
        JOIN "Vehicle" v ON v.id = b."vehicleId"
        WHERE b."startDate" < ${endDate}
          AND b."endDate" > ${startDate}
          AND b."status" IN ('PENDING', 'CONFIRMED')
          AND b."holdExpiresAt" > now()
          AND v."status" = 'ACTIVE'
          AND v."category" = ${category.name}
      `;
      overlappingBookings = rows?.[0]?.count ?? 0;
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

"use server";

import { db } from "@/lib/db";
import { cancelExpiredHolds } from "./booking";
import { getMinBookingDays } from "@/lib/settings";
import { ensureVehicleBlockoutsTable } from "@/lib/vehicle-blockouts";
import { getCategoryFeatureNames } from "@/lib/vehicle-features";

export interface AvailabilityResult {
  categoryId: string;
  categoryName: string;
  categoryImageUrl?: string | null;
  seats?: number;
  transmission?: "AUTOMATIC" | "MANUAL";
  features: string[];
  dailyRate: number;
  availableCount: number;
  totalForRange: number;
}

type InfoSchemaColumn = {
  column_name: string;
};

export async function searchAvailabilityAction(
  startDate: Date,
  endDate: Date
): Promise<AvailabilityResult[]> {
  const minDays = await getMinBookingDays();
  const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  if (days < minDays) return [];

  // Cancel expired holds first
  await cancelExpiredHolds();
  await ensureVehicleBlockoutsTable();

  // Some runtime environments may not expose the generated model accessor (db.vehicleCategory)
  // fall back to a raw query if it's not available to avoid TypeError on server.
  let categories: Array<any> = [];
  if ((db as any).vehicleCategory && typeof (db as any).vehicleCategory.findMany === "function") {
    categories = await (db as any).vehicleCategory.findMany({
      where: { isActive: true },
      include: { features: { include: { feature: true }, orderBy: { feature: { sortOrder: "asc" } } } },
      orderBy: { sortOrder: "asc" },
    });
  } else {
    // raw query fallback
    categories = await db.$queryRaw<Array<any>>`\
      SELECT id, name, description, "imageUrl", seats, transmission, "hasAC", "hasCarPlay", "hasBackupCamera", "dailyRate", "isActive", "sortOrder", "createdAt"\
      FROM "VehicleCategory"\
      WHERE "isActive" = true\
      ORDER BY "sortOrder" ASC\
    `;
  }

  const results: AvailabilityResult[] = [];
  const vehicleColumns: InfoSchemaColumn[] = await db.$queryRaw<InfoSchemaColumn[]>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Vehicle'
  `;
  const bookingColumns: InfoSchemaColumn[] = await db.$queryRaw<InfoSchemaColumn[]>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Booking'
  `;

  const hasVehicleCategoryId = vehicleColumns.some((column: InfoSchemaColumn) => column.column_name === "categoryId");
  const hasVehicleCategory = vehicleColumns.some((column: InfoSchemaColumn) => column.column_name === "category");
  const hasBookingCategoryId = bookingColumns.some((column: InfoSchemaColumn) => column.column_name === "categoryId");

  for (const category of categories) {
    let availableCount = 0;
    if (hasVehicleCategoryId) {
      const rows = await db.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int AS count
        FROM "Vehicle" v
        WHERE v."status" = 'ACTIVE'
          AND v."categoryId" = ${category.id}
          AND NOT EXISTS (
            SELECT 1
            FROM "Booking" b
            WHERE b."vehicleId" = v.id
              AND b."startDate" < ${endDate}
              AND b."endDate" > ${startDate}
              AND (
                b."status" = 'CONFIRMED'
                OR (b."status" = 'PENDING' AND b."holdExpiresAt" > now())
              )
          )
          AND NOT EXISTS (
            SELECT 1
            FROM "VehicleBlockout" vb
            WHERE (vb."vehicleId" IS NULL OR vb."vehicleId" = v.id)
              AND vb."startDate" < ${endDate}
              AND vb."endDate" > ${startDate}
          )
      `;
      availableCount = rows?.[0]?.count ?? 0;
    } else if (hasVehicleCategory) {
      const rows = await db.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int AS count
        FROM "Vehicle" v
        WHERE v."status" = 'ACTIVE'
          AND v."category" = ${category.name}
          AND NOT EXISTS (
            SELECT 1
            FROM "Booking" b
            WHERE b."vehicleId" = v.id
              AND b."startDate" < ${endDate}
              AND b."endDate" > ${startDate}
              AND (
                b."status" = 'CONFIRMED'
                OR (b."status" = 'PENDING' AND b."holdExpiresAt" > now())
              )
          )
          AND NOT EXISTS (
            SELECT 1
            FROM "VehicleBlockout" vb
            WHERE (vb."vehicleId" IS NULL OR vb."vehicleId" = v.id)
              AND vb."startDate" < ${endDate}
              AND vb."endDate" > ${startDate}
          )
      `;
      availableCount = rows?.[0]?.count ?? 0;
    } else if (hasBookingCategoryId) {
      const totalRows = await db.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int AS count
        FROM "Vehicle"
        WHERE "status" = 'ACTIVE'
      `;
      const totalVehicles = totalRows?.[0]?.count ?? 0;
      const bookingRows = await db.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int AS count
        FROM "Booking"
        WHERE "startDate" < ${endDate}
          AND "endDate" > ${startDate}
          AND (
            "status" = 'CONFIRMED'
            OR ("status" = 'PENDING' AND "holdExpiresAt" > now())
          )
          AND "categoryId" = ${category.id}
      `;
      const globalBlockRows = await db.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int AS count
        FROM "VehicleBlockout"
        WHERE "vehicleId" IS NULL
          AND "startDate" < ${endDate}
          AND "endDate" > ${startDate}
      `;
      availableCount = globalBlockRows?.[0]?.count ? 0 : Math.max(0, totalVehicles - (bookingRows?.[0]?.count ?? 0));
    }
    const totalForRange = category.dailyRate * days;

    results.push({
      categoryId: category.id,
      categoryName: category.name,
      categoryImageUrl: category.imageUrl ?? null,
      seats: category.seats ?? 5,
      transmission: category.transmission ?? "AUTOMATIC",
      features: getCategoryFeatureNames(category),
      dailyRate: category.dailyRate,
      availableCount,
      totalForRange,
    });
  }

  return results;
}

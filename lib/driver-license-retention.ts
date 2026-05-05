import { del } from "@vercel/blob";
import { db } from "@/lib/db";
import { ensureBookingAdditionalDriversTable } from "@/lib/additional-drivers.server";

const DRIVER_LICENSE_RETENTION_DAYS = 30;

type DriverLicenseRecord = {
  id: string;
  additionalDriverId: string | null;
  bookingCode: string;
  driverLicenseUrl: string | null;
  driverLicenseDeleteAfter: Date | null;
  driverLicenseDeletedAt: Date | null;
};

export function calculateDriverLicenseDeleteAfter(endDate: Date): Date {
  const next = new Date(endDate);
  next.setDate(next.getDate() + DRIVER_LICENSE_RETENTION_DAYS);
  return next;
}

export async function findDriverLicenseRecordByUrl(url: string): Promise<DriverLicenseRecord | null> {
  await ensureBookingAdditionalDriversTable();
  const rows = await db.$queryRaw<DriverLicenseRecord[]>`
    SELECT *
    FROM (
      SELECT
        b.id,
        NULL::TEXT as "additionalDriverId",
        b."bookingCode",
        b."driverLicenseUrl",
        b."driverLicenseDeleteAfter",
        b."driverLicenseDeletedAt"
      FROM "Booking" b
      WHERE b."driverLicenseUrl" = ${url}

      UNION ALL

      SELECT
        b.id,
        ad.id as "additionalDriverId",
        b."bookingCode",
        ad."driverLicenseUrl",
        b."driverLicenseDeleteAfter",
        ad."driverLicenseDeletedAt"
      FROM "BookingAdditionalDriver" ad
      JOIN "Booking" b ON b.id = ad."bookingId"
      WHERE ad."driverLicenseUrl" = ${url}
    ) matches
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export function isDriverLicenseExpired(record: Pick<DriverLicenseRecord, "driverLicenseDeleteAfter" | "driverLicenseDeletedAt">, now = new Date()): boolean {
  return !!record.driverLicenseDeletedAt || (!!record.driverLicenseDeleteAfter && record.driverLicenseDeleteAfter <= now);
}

export async function deleteDriverLicenseForBooking(record: DriverLicenseRecord, deletedAt = new Date()) {
  if (record.driverLicenseUrl) {
    await del(record.driverLicenseUrl, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
  }

  if (record.additionalDriverId) {
    await db.$executeRaw`
      UPDATE "BookingAdditionalDriver"
      SET
        "driverLicenseUrl" = NULL,
        "driverLicenseDeletedAt" = ${deletedAt}
      WHERE id = ${record.additionalDriverId}
    `;
    return;
  }

  await db.$executeRaw`
    UPDATE "Booking"
    SET
      "driverLicenseUrl" = NULL,
      "driverLicenseDeletedAt" = ${deletedAt}
    WHERE id = ${record.id}
  `;
}

export async function cleanupExpiredDriverLicenses(limit = 50) {
  await ensureBookingAdditionalDriversTable();
  const now = new Date();
  const due = await db.$queryRaw<DriverLicenseRecord[]>`
    SELECT *
    FROM (
      SELECT
        b.id,
        NULL::TEXT as "additionalDriverId",
        b."bookingCode",
        b."driverLicenseUrl",
        b."driverLicenseDeleteAfter",
        b."driverLicenseDeletedAt"
      FROM "Booking" b
      WHERE b."driverLicenseUrl" IS NOT NULL
        AND b."driverLicenseDeletedAt" IS NULL
        AND b."driverLicenseDeleteAfter" IS NOT NULL
        AND b."driverLicenseDeleteAfter" <= ${now}

      UNION ALL

      SELECT
        b.id,
        ad.id as "additionalDriverId",
        b."bookingCode",
        ad."driverLicenseUrl",
        b."driverLicenseDeleteAfter",
        ad."driverLicenseDeletedAt"
      FROM "BookingAdditionalDriver" ad
      JOIN "Booking" b ON b.id = ad."bookingId"
      WHERE ad."driverLicenseUrl" IS NOT NULL
        AND ad."driverLicenseDeletedAt" IS NULL
        AND b."driverLicenseDeleteAfter" IS NOT NULL
        AND b."driverLicenseDeleteAfter" <= ${now}
    ) due
    ORDER BY "driverLicenseDeleteAfter" ASC
    LIMIT ${limit}
  `;

  const deletedBookingCodes: string[] = [];
  const failed: Array<{ bookingCode: string; error: string }> = [];

  for (const record of due) {
    try {
      await deleteDriverLicenseForBooking(record, now);
      deletedBookingCodes.push(record.bookingCode);
    } catch (error: any) {
      failed.push({
        bookingCode: record.bookingCode,
        error: String(error?.message || "Failed to delete driver license"),
      });
    }
  }

  return {
    processed: due.length,
    deleted: deletedBookingCodes.length,
    deletedBookingCodes,
    failed,
  };
}

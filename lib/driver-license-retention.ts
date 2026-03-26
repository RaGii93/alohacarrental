import { del } from "@vercel/blob";
import { db } from "@/lib/db";

const DRIVER_LICENSE_RETENTION_DAYS = 30;

type DriverLicenseRecord = {
  id: string;
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
  const rows = await db.$queryRaw<DriverLicenseRecord[]>`
    SELECT
      id,
      "bookingCode",
      "driverLicenseUrl",
      "driverLicenseDeleteAfter",
      "driverLicenseDeletedAt"
    FROM "Booking"
    WHERE "driverLicenseUrl" = ${url}
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

  await db.$executeRaw`
    UPDATE "Booking"
    SET
      "driverLicenseUrl" = NULL,
      "driverLicenseDeletedAt" = ${deletedAt}
    WHERE id = ${record.id}
  `;
}

export async function cleanupExpiredDriverLicenses(limit = 50) {
  const now = new Date();
  const due = await db.$queryRaw<DriverLicenseRecord[]>`
    SELECT
      id,
      "bookingCode",
      "driverLicenseUrl",
      "driverLicenseDeleteAfter",
      "driverLicenseDeletedAt"
    FROM "Booking"
    WHERE "driverLicenseUrl" IS NOT NULL
      AND "driverLicenseDeletedAt" IS NULL
      AND "driverLicenseDeleteAfter" IS NOT NULL
      AND "driverLicenseDeleteAfter" <= ${now}
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

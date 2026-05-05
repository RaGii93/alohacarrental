import { db } from "@/lib/db";

export async function ensureBookingAdditionalDriversTable(client: typeof db = db) {
  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "BookingAdditionalDriver" (
      id TEXT PRIMARY KEY,
      "bookingId" TEXT NOT NULL REFERENCES "Booking"(id) ON DELETE CASCADE,
      "fullName" TEXT NOT NULL,
      "birthDate" TIMESTAMP NOT NULL,
      "driverLicenseNumber" TEXT NOT NULL,
      "licenseExpiryDate" TIMESTAMP NOT NULL,
      "driverLicenseUrl" TEXT,
      "driverLicenseDeletedAt" TIMESTAMP NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await client.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "BookingAdditionalDriver_bookingId_idx"
    ON "BookingAdditionalDriver" ("bookingId")
  `);
}

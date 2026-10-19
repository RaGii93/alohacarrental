import { db } from "@/lib/db";

export { parseCustomDailyRate } from "@/lib/booking-pricing-rules";

export async function ensureBookingPriceOverrides() {
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "BookingPriceOverride" (
      "bookingId" TEXT PRIMARY KEY REFERENCES "Booking"(id) ON DELETE CASCADE,
      "dailyRate" INTEGER NOT NULL CHECK ("dailyRate" > 0)
    )
  `);
}

export async function getBookingCustomDailyRate(bookingId: string): Promise<number | null> {
  await ensureBookingPriceOverrides();
  const rows = await db.$queryRaw<Array<{ dailyRate: number }>>`
    SELECT "dailyRate" FROM "BookingPriceOverride" WHERE "bookingId" = ${bookingId}
  `;
  return rows[0]?.dailyRate ?? null;
}

export async function saveBookingCustomDailyRate(client: typeof db, bookingId: string, cents: number | null) {
  if (cents === null) {
    await client.$executeRaw`DELETE FROM "BookingPriceOverride" WHERE "bookingId" = ${bookingId}`;
  } else {
    await client.$executeRaw`
      INSERT INTO "BookingPriceOverride" ("bookingId", "dailyRate") VALUES (${bookingId}, ${cents})
      ON CONFLICT ("bookingId") DO UPDATE SET "dailyRate" = EXCLUDED."dailyRate"
    `;
  }
}

ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "actualReturnedAt" TIMESTAMP(3);
CREATE TABLE IF NOT EXISTS "BookingPriceOverride" (
  "bookingId" TEXT PRIMARY KEY REFERENCES "Booking"("id") ON DELETE CASCADE,
  "dailyRate" INTEGER NOT NULL CHECK ("dailyRate" > 0)
);

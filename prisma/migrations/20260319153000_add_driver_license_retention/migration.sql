ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "driverLicenseDeleteAfter" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "driverLicenseDeletedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Booking_driverLicenseDeleteAfter_driverLicenseDeletedAt_idx"
  ON "Booking"("driverLicenseDeleteAfter", "driverLicenseDeletedAt");

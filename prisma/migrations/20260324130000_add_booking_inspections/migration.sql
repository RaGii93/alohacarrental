DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InspectionStage') THEN
    CREATE TYPE "InspectionStage" AS ENUM ('PICKUP', 'RETURN');
  END IF;
END $$;

ALTER TABLE "Booking"
ADD COLUMN IF NOT EXISTS "pickupOdometerKm" INTEGER,
ADD COLUMN IF NOT EXISTS "pickupFuelLevel" INTEGER,
ADD COLUMN IF NOT EXISTS "pickupHasDamage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "pickupDamageNotes" TEXT,
ADD COLUMN IF NOT EXISTS "pickupAcceptedBy" TEXT,
ADD COLUMN IF NOT EXISTS "pickupAcceptedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "pickupAgentNotes" TEXT,
ADD COLUMN IF NOT EXISTS "returnOdometerKm" INTEGER,
ADD COLUMN IF NOT EXISTS "returnFuelLevel" INTEGER,
ADD COLUMN IF NOT EXISTS "returnHasDamage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "returnDamageNotes" TEXT,
ADD COLUMN IF NOT EXISTS "returnAcceptedBy" TEXT,
ADD COLUMN IF NOT EXISTS "returnAcceptedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "returnAgentNotes" TEXT,
ADD COLUMN IF NOT EXISTS "returnFuelCharge" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "returnDamageCharge" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "BookingInspectionPhoto" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "stage" "InspectionStage" NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BookingInspectionPhoto_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BookingInspectionPhoto_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "BookingInspectionPhoto_bookingId_stage_createdAt_idx"
ON "BookingInspectionPhoto" ("bookingId", "stage", "createdAt");

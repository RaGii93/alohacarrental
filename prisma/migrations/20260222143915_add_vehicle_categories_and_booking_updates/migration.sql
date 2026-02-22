/*
  Warnings:

  - You are about to drop the column `category` on the `Vehicle` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bookingCode]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bookingCode` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "VehicleCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dailyRate" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VehicleCategory_name_key" ON "VehicleCategory"("name");

-- CreateIndex
CREATE INDEX "VehicleCategory_isActive_idx" ON "VehicleCategory"("isActive");

-- CreateIndex
CREATE INDEX "VehicleCategory_sortOrder_idx" ON "VehicleCategory"("sortOrder");

-- Insert default categories
INSERT INTO "VehicleCategory" ("id", "name", "description", "dailyRate", "isActive", "sortOrder", "createdAt") VALUES
('cat_economy', 'Economy', 'Compact and fuel-efficient vehicles', 2500, true, 1, CURRENT_TIMESTAMP),
('cat_suv', 'SUV', 'Spacious vehicles for families and adventures', 4500, true, 2, CURRENT_TIMESTAMP),
('cat_pickup', 'Pickup', 'Versatile trucks for work and transport', 4000, true, 3, CURRENT_TIMESTAMP);

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_vehicleId_fkey";

-- Update existing vehicles to use categoryId based on their old category string BEFORE dropping the column
UPDATE "Vehicle" SET "category" = 'Economy' WHERE "category" IS NULL OR "category" = '';

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "categoryId" TEXT;

-- Update existing vehicles to use categoryId based on their old category string
UPDATE "Vehicle" SET "categoryId" = 
  CASE 
    WHEN "category" = 'SUV' THEN 'cat_suv'
    WHEN "category" = 'Pickup' THEN 'cat_pickup'
    ELSE 'cat_economy'
  END;

-- Make categoryId NOT NULL
ALTER TABLE "Vehicle" ALTER COLUMN "categoryId" SET NOT NULL;

-- Drop the old category column
ALTER TABLE "Vehicle" DROP COLUMN "category";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "bookingCode" TEXT,
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "driverLicenseNumber" TEXT,
ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3),
ALTER COLUMN "vehicleId" DROP NOT NULL,
ALTER COLUMN "holdExpiresAt" SET DEFAULT now() + INTERVAL '2 hours';

-- Update existing bookings to use categoryId from their vehicle
UPDATE "Booking" SET "categoryId" = "Vehicle"."categoryId" FROM "Vehicle" WHERE "Booking"."vehicleId" = "Vehicle"."id";

-- Make categoryId NOT NULL
ALTER TABLE "Booking" ALTER COLUMN "categoryId" SET NOT NULL;

-- Generate unique booking codes for existing bookings
UPDATE "Booking" SET "bookingCode" = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)) WHERE "bookingCode" IS NULL;

-- Make bookingCode NOT NULL after populating
ALTER TABLE "Booking" ALTER COLUMN "bookingCode" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingCode_key" ON "Booking"("bookingCode");

-- CreateIndex
CREATE INDEX "Booking_categoryId_startDate_endDate_idx" ON "Booking"("categoryId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "Booking_bookingCode_idx" ON "Booking"("bookingCode");

-- CreateIndex
CREATE INDEX "Vehicle_categoryId_idx" ON "Vehicle"("categoryId");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "VehicleCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "VehicleCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

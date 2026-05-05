CREATE TABLE "BookingAdditionalDriver" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "driverLicenseNumber" TEXT NOT NULL,
    "licenseExpiryDate" TIMESTAMP(3) NOT NULL,
    "driverLicenseUrl" TEXT,
    "driverLicenseDeletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingAdditionalDriver_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BookingAdditionalDriver_bookingId_idx" ON "BookingAdditionalDriver"("bookingId");

ALTER TABLE "BookingAdditionalDriver"
ADD CONSTRAINT "BookingAdditionalDriver_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

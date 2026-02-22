-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "holdExpiresAt" SET DEFAULT now() + INTERVAL '2 hours';

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "imageUrl" TEXT;

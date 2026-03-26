DO $$
BEGIN
  CREATE TYPE "ZohoTransferStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "ZohoDocumentType" AS ENUM ('INVOICE', 'SALES_RECEIPT', 'PAYMENT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Booking"
ADD COLUMN IF NOT EXISTS "zohoTransferStatus" "ZohoTransferStatus",
ADD COLUMN IF NOT EXISTS "zohoDocumentType" "ZohoDocumentType",
ADD COLUMN IF NOT EXISTS "zohoCustomerId" TEXT,
ADD COLUMN IF NOT EXISTS "zohoInvoiceId" TEXT,
ADD COLUMN IF NOT EXISTS "zohoPaymentId" TEXT,
ADD COLUMN IF NOT EXISTS "zohoLastError" TEXT,
ADD COLUMN IF NOT EXISTS "zohoSyncRequestedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "zohoSyncedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Booking_zohoTransferStatus_idx" ON "Booking"("zohoTransferStatus");

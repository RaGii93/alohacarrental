DO $$
BEGIN
  CREATE TYPE "BillingDocumentType" AS ENUM ('INVOICE', 'SALES_RECEIPT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "QuickBooksTransferStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "QuickBooksDocumentType" AS ENUM ('INVOICE', 'SALES_RECEIPT', 'PAYMENT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Booking"
ADD COLUMN IF NOT EXISTS "billingDocumentType" "BillingDocumentType",
ADD COLUMN IF NOT EXISTS "quickBooksTransferStatus" "QuickBooksTransferStatus",
ADD COLUMN IF NOT EXISTS "quickBooksDocumentType" "QuickBooksDocumentType",
ADD COLUMN IF NOT EXISTS "quickBooksCustomerId" TEXT,
ADD COLUMN IF NOT EXISTS "quickBooksInvoiceId" TEXT,
ADD COLUMN IF NOT EXISTS "quickBooksSalesReceiptId" TEXT,
ADD COLUMN IF NOT EXISTS "quickBooksPaymentId" TEXT,
ADD COLUMN IF NOT EXISTS "quickBooksLastError" TEXT,
ADD COLUMN IF NOT EXISTS "quickBooksSyncRequestedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "quickBooksSyncedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Booking_billingDocumentType_idx" ON "Booking"("billingDocumentType");
CREATE INDEX IF NOT EXISTS "Booking_quickBooksTransferStatus_idx" ON "Booking"("quickBooksTransferStatus");

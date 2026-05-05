-- Add booking custom location metadata (additive, nullable)
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "pickupLocationAddress" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "pickupLatitude" DOUBLE PRECISION;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "pickupLongitude" DOUBLE PRECISION;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "dropoffLocationAddress" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "dropoffLatitude" DOUBLE PRECISION;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "dropoffLongitude" DOUBLE PRECISION;

-- Create automation enums if they do not already exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AutomationTriggerType') THEN
    CREATE TYPE "AutomationTriggerType" AS ENUM (
      'booking_created',
      'booking_confirmed',
      'invoice_sent',
      'payment_received',
      'pickup_due_24h',
      'return_due_24h',
      'booking_overdue',
      'review_request_due',
      'unpaid_booking_before_pickup',
      'return_completed'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AutomationActionType') THEN
    CREATE TYPE "AutomationActionType" AS ENUM (
      'send_email',
      'create_admin_alert',
      'create_crm_log',
      'enqueue_webhook',
      'mark_follow_up',
      'send_review_request'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AutomationExecutionStatus') THEN
    CREATE TYPE "AutomationExecutionStatus" AS ENUM (
      'success',
      'skipped',
      'failed'
    );
  END IF;
END
$$;

-- Create automation tables (additive)
CREATE TABLE IF NOT EXISTS "AutomationRule" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "triggerType" "AutomationTriggerType" NOT NULL,
  "triggerOffsetMinutes" INTEGER,
  "conditions" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "actionType" "AutomationActionType" NOT NULL,
  "actionConfig" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AutomationExecutionLog" (
  "id" TEXT PRIMARY KEY,
  "ruleId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL DEFAULT 'booking',
  "entityId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "status" "AutomationExecutionStatus" NOT NULL,
  "errorDetails" TEXT,
  "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AutomationExecutionLog_ruleId_fkey"
    FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "AutomationExecutionLog_idempotencyKey_key"
  ON "AutomationExecutionLog"("idempotencyKey");

CREATE INDEX IF NOT EXISTS "AutomationRule_isActive_triggerType_idx"
  ON "AutomationRule"("isActive", "triggerType");

CREATE INDEX IF NOT EXISTS "AutomationRule_sortOrder_idx"
  ON "AutomationRule"("sortOrder");

CREATE INDEX IF NOT EXISTS "AutomationExecutionLog_ruleId_entityId_idx"
  ON "AutomationExecutionLog"("ruleId", "entityId");

CREATE INDEX IF NOT EXISTS "AutomationExecutionLog_entityId_idx"
  ON "AutomationExecutionLog"("entityId");

CREATE INDEX IF NOT EXISTS "AutomationExecutionLog_executedAt_idx"
  ON "AutomationExecutionLog"("executedAt");

-- Create RentalAgreement enums and tables (additive)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RentalAgreementStatus') THEN
    CREATE TYPE "RentalAgreementStatus" AS ENUM (
      'DRAFT', 'GENERATED', 'AWAITING_SIGNATURES', 'SIGNED', 'VOID'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AgreementSignerRole') THEN
    CREATE TYPE "AgreementSignerRole" AS ENUM ('CUSTOMER', 'AGENT');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "RentalAgreement" (
  "id"              TEXT PRIMARY KEY,
  "bookingId"       TEXT NOT NULL,
  "agreementNumber" TEXT NOT NULL,
  "status"          "RentalAgreementStatus" NOT NULL DEFAULT 'DRAFT',
  "termsVersion"    TEXT,
  "termsSnippet"    TEXT,
  "pdfUrl"          TEXT,
  "signedPdfUrl"    TEXT,
  "signedAt"        TIMESTAMP(3),
  "voidedAt"        TIMESTAMP(3),
  "voidReason"      TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RentalAgreement_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "RentalAgreement_bookingId_key" ON "RentalAgreement"("bookingId");
CREATE UNIQUE INDEX IF NOT EXISTS "RentalAgreement_agreementNumber_key" ON "RentalAgreement"("agreementNumber");
CREATE INDEX IF NOT EXISTS "RentalAgreement_status_idx" ON "RentalAgreement"("status");
CREATE INDEX IF NOT EXISTS "RentalAgreement_createdAt_idx" ON "RentalAgreement"("createdAt");

CREATE TABLE IF NOT EXISTS "RentalAgreementSignature" (
  "id"                TEXT PRIMARY KEY,
  "rentalAgreementId" TEXT NOT NULL,
  "signerName"        TEXT NOT NULL,
  "signerEmail"       TEXT,
  "signerRole"        "AgreementSignerRole" NOT NULL,
  "signatureDataUrl"  TEXT NOT NULL,
  "signedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress"         TEXT,
  "userAgent"         TEXT,
  CONSTRAINT "RentalAgreementSignature_rentalAgreementId_fkey"
    FOREIGN KEY ("rentalAgreementId") REFERENCES "RentalAgreement"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "RentalAgreementSignature_rentalAgreementId_idx" ON "RentalAgreementSignature"("rentalAgreementId");
CREATE INDEX IF NOT EXISTS "RentalAgreementSignature_signerRole_idx" ON "RentalAgreementSignature"("signerRole");

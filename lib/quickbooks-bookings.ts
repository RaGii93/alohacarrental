/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/lib/db";

export type BillingDocumentTypeValue = "INVOICE" | "SALES_RECEIPT";
export type QuickBooksTransferStatusValue = "PENDING" | "COMPLETED" | "FAILED";
export type QuickBooksDocumentTypeValue = "INVOICE" | "SALES_RECEIPT" | "PAYMENT";

type DbLike = typeof db;

export type QuickBooksBookingSyncPayload = {
  id: string;
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  startDate: Date;
  endDate: Date;
  paymentReceivedAt: Date | null;
  billingDocumentType: BillingDocumentTypeValue | null;
  quickBooksCustomerId: string | null;
  quickBooksInvoiceId: string | null;
  quickBooksSalesReceiptId: string | null;
  quickBooksPaymentId: string | null;
};

export async function ensureQuickBooksBookingColumns(client: DbLike = db) {
  await client.$executeRawUnsafe(`
    DO $$
    BEGIN
      CREATE TYPE "BillingDocumentType" AS ENUM ('INVOICE', 'SALES_RECEIPT');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await client.$executeRawUnsafe(`
    DO $$
    BEGIN
      CREATE TYPE "QuickBooksTransferStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await client.$executeRawUnsafe(`
    DO $$
    BEGIN
      CREATE TYPE "QuickBooksDocumentType" AS ENUM ('INVOICE', 'SALES_RECEIPT', 'PAYMENT');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await client.$executeRawUnsafe(`
    ALTER TABLE "Booking"
    ADD COLUMN IF NOT EXISTS "billingDocumentType" "BillingDocumentType" NULL,
    ADD COLUMN IF NOT EXISTS "quickBooksTransferStatus" "QuickBooksTransferStatus" NULL,
    ADD COLUMN IF NOT EXISTS "quickBooksDocumentType" "QuickBooksDocumentType" NULL,
    ADD COLUMN IF NOT EXISTS "quickBooksCustomerId" TEXT NULL,
    ADD COLUMN IF NOT EXISTS "quickBooksInvoiceId" TEXT NULL,
    ADD COLUMN IF NOT EXISTS "quickBooksSalesReceiptId" TEXT NULL,
    ADD COLUMN IF NOT EXISTS "quickBooksPaymentId" TEXT NULL,
    ADD COLUMN IF NOT EXISTS "quickBooksLastError" TEXT NULL,
    ADD COLUMN IF NOT EXISTS "quickBooksSyncRequestedAt" TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS "quickBooksSyncedAt" TIMESTAMP NULL
  `);
  await client.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Booking_billingDocumentType_idx"
    ON "Booking"("billingDocumentType")
  `);
  await client.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Booking_quickBooksTransferStatus_idx"
    ON "Booking"("quickBooksTransferStatus")
  `);
}

export async function markBookingBillingDocument(
  bookingId: string,
  documentType: BillingDocumentTypeValue,
  client: DbLike = db
) {
  await ensureQuickBooksBookingColumns(client);
  const quickBooksDocumentType: QuickBooksDocumentTypeValue =
    documentType === "SALES_RECEIPT" ? "SALES_RECEIPT" : "INVOICE";
  await client.$executeRaw`
    UPDATE "Booking"
    SET
      "billingDocumentType" = ${documentType}::"BillingDocumentType",
      "quickBooksTransferStatus" = 'PENDING'::"QuickBooksTransferStatus",
      "quickBooksDocumentType" = ${quickBooksDocumentType}::"QuickBooksDocumentType",
      "quickBooksLastError" = NULL,
      "quickBooksSyncRequestedAt" = NOW(),
      "quickBooksSyncedAt" = NULL
    WHERE id = ${bookingId}
  `;
}

export async function queueBookingQuickBooksTransfer(
  bookingId: string,
  documentType: QuickBooksDocumentTypeValue,
  client: DbLike = db
) {
  await ensureQuickBooksBookingColumns(client);
  await client.$executeRaw`
    UPDATE "Booking"
    SET
      "quickBooksTransferStatus" = 'PENDING'::"QuickBooksTransferStatus",
      "quickBooksDocumentType" = ${documentType}::"QuickBooksDocumentType",
      "quickBooksLastError" = NULL,
      "quickBooksSyncRequestedAt" = NOW()
    WHERE id = ${bookingId}
  `;
}

export async function markBookingQuickBooksCompleted(
  bookingId: string,
  documentType: QuickBooksDocumentTypeValue,
  ids: {
    customerId?: string;
    invoiceId?: string;
    salesReceiptId?: string;
    paymentId?: string;
  },
  client: DbLike = db
) {
  await ensureQuickBooksBookingColumns(client);
  await client.$executeRaw`
    UPDATE "Booking"
    SET
      "quickBooksTransferStatus" = 'COMPLETED'::"QuickBooksTransferStatus",
      "quickBooksDocumentType" = ${documentType}::"QuickBooksDocumentType",
      "quickBooksCustomerId" = COALESCE(${ids.customerId || null}, "quickBooksCustomerId"),
      "quickBooksInvoiceId" = COALESCE(${ids.invoiceId || null}, "quickBooksInvoiceId"),
      "quickBooksSalesReceiptId" = COALESCE(${ids.salesReceiptId || null}, "quickBooksSalesReceiptId"),
      "quickBooksPaymentId" = COALESCE(${ids.paymentId || null}, "quickBooksPaymentId"),
      "quickBooksLastError" = NULL,
      "quickBooksSyncedAt" = NOW()
    WHERE id = ${bookingId}
  `;
}

export async function markBookingQuickBooksFailed(
  bookingId: string,
  documentType: QuickBooksDocumentTypeValue,
  error: string,
  client: DbLike = db
) {
  await ensureQuickBooksBookingColumns(client);
  await client.$executeRaw`
    UPDATE "Booking"
    SET
      "quickBooksTransferStatus" = 'FAILED'::"QuickBooksTransferStatus",
      "quickBooksDocumentType" = ${documentType}::"QuickBooksDocumentType",
      "quickBooksLastError" = ${String(error || "").slice(0, 2000)},
      "quickBooksSyncedAt" = NULL
    WHERE id = ${bookingId}
  `;
}

export async function loadBookingQuickBooksSyncPayload(bookingId: string, client: DbLike = db) {
  await ensureQuickBooksBookingColumns(client);
  const rows = await client.$queryRaw<Array<QuickBooksBookingSyncPayload>>`
    SELECT
      id,
      "bookingCode",
      "customerName",
      "customerEmail",
      "customerPhone",
      "totalAmount",
      "startDate",
      "endDate",
      "paymentReceivedAt",
      "billingDocumentType",
      "quickBooksCustomerId",
      "quickBooksInvoiceId",
      "quickBooksSalesReceiptId",
      "quickBooksPaymentId"
    FROM "Booking"
    WHERE id = ${bookingId}
    LIMIT 1
  `;
  return rows[0] || null;
}

export function resolveBookingQuickBooksTransfer(
  booking: Pick<QuickBooksBookingSyncPayload, "billingDocumentType" | "paymentReceivedAt">
) {
  if (booking.billingDocumentType === "SALES_RECEIPT") {
    return { kind: "sales_receipt" as const, documentType: "SALES_RECEIPT" as const };
  }
  if (booking.billingDocumentType === "INVOICE" && booking.paymentReceivedAt) {
    return { kind: "payment" as const, documentType: "PAYMENT" as const };
  }
  if (booking.billingDocumentType === "INVOICE") {
    return { kind: "invoice" as const, documentType: "INVOICE" as const };
  }
  return null;
}

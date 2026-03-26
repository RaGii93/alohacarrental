/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/lib/db";

export type ZohoTransferStatusValue = "PENDING" | "COMPLETED" | "FAILED";
export type ZohoDocumentTypeValue = "INVOICE" | "SALES_RECEIPT" | "PAYMENT";
export type BillingDocumentTypeValue = "INVOICE" | "SALES_RECEIPT";

type DbLike = typeof db;

export type ZohoBookingSyncPayload = {
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
  zohoCustomerId: string | null;
  zohoInvoiceId: string | null;
  zohoPaymentId: string | null;
};

export async function ensureZohoBookingColumns(client: DbLike = db) {
  await client.$executeRawUnsafe(`
    DO $$
    BEGIN
      CREATE TYPE "ZohoTransferStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await client.$executeRawUnsafe(`
    DO $$
    BEGIN
      CREATE TYPE "ZohoDocumentType" AS ENUM ('INVOICE', 'SALES_RECEIPT', 'PAYMENT');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await client.$executeRawUnsafe(`
    ALTER TABLE "Booking"
    ADD COLUMN IF NOT EXISTS "zohoTransferStatus" "ZohoTransferStatus" NULL,
    ADD COLUMN IF NOT EXISTS "zohoDocumentType" "ZohoDocumentType" NULL,
    ADD COLUMN IF NOT EXISTS "zohoCustomerId" TEXT NULL,
    ADD COLUMN IF NOT EXISTS "zohoInvoiceId" TEXT NULL,
    ADD COLUMN IF NOT EXISTS "zohoPaymentId" TEXT NULL,
    ADD COLUMN IF NOT EXISTS "zohoLastError" TEXT NULL,
    ADD COLUMN IF NOT EXISTS "zohoSyncRequestedAt" TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS "zohoSyncedAt" TIMESTAMP NULL
  `);
  await client.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Booking_zohoTransferStatus_idx"
    ON "Booking"("zohoTransferStatus")
  `);
}

export async function markBookingBillingDocumentZoho(
  bookingId: string,
  documentType: BillingDocumentTypeValue,
  client: DbLike = db
) {
  await ensureZohoBookingColumns(client);
  const zohoDocumentType: ZohoDocumentTypeValue =
    documentType === "SALES_RECEIPT" ? "SALES_RECEIPT" : "INVOICE";
  await client.$executeRaw`
    UPDATE "Booking"
    SET
      "billingDocumentType" = ${documentType}::"BillingDocumentType",
      "zohoTransferStatus" = 'PENDING'::"ZohoTransferStatus",
      "zohoDocumentType" = ${zohoDocumentType}::"ZohoDocumentType",
      "zohoLastError" = NULL,
      "zohoSyncRequestedAt" = NOW(),
      "zohoSyncedAt" = NULL
    WHERE id = ${bookingId}
  `;
}

export async function queueBookingZohoTransfer(
  bookingId: string,
  documentType: ZohoDocumentTypeValue,
  client: DbLike = db
) {
  await ensureZohoBookingColumns(client);
  await client.$executeRaw`
    UPDATE "Booking"
    SET
      "zohoTransferStatus" = 'PENDING'::"ZohoTransferStatus",
      "zohoDocumentType" = ${documentType}::"ZohoDocumentType",
      "zohoLastError" = NULL,
      "zohoSyncRequestedAt" = NOW()
    WHERE id = ${bookingId}
  `;
}

export async function markBookingZohoCompleted(
  bookingId: string,
  documentType: ZohoDocumentTypeValue,
  ids: {
    customerId?: string;
    invoiceId?: string;
    paymentId?: string;
  },
  client: DbLike = db
) {
  await ensureZohoBookingColumns(client);
  await client.$executeRaw`
    UPDATE "Booking"
    SET
      "zohoTransferStatus" = 'COMPLETED'::"ZohoTransferStatus",
      "zohoDocumentType" = ${documentType}::"ZohoDocumentType",
      "zohoCustomerId" = COALESCE(${ids.customerId || null}, "zohoCustomerId"),
      "zohoInvoiceId" = COALESCE(${ids.invoiceId || null}, "zohoInvoiceId"),
      "zohoPaymentId" = COALESCE(${ids.paymentId || null}, "zohoPaymentId"),
      "zohoLastError" = NULL,
      "zohoSyncedAt" = NOW()
    WHERE id = ${bookingId}
  `;
}

export async function markBookingZohoFailed(
  bookingId: string,
  documentType: ZohoDocumentTypeValue,
  error: string,
  client: DbLike = db
) {
  await ensureZohoBookingColumns(client);
  await client.$executeRaw`
    UPDATE "Booking"
    SET
      "zohoTransferStatus" = 'FAILED'::"ZohoTransferStatus",
      "zohoDocumentType" = ${documentType}::"ZohoDocumentType",
      "zohoLastError" = ${String(error || "").slice(0, 2000)},
      "zohoSyncedAt" = NULL
    WHERE id = ${bookingId}
  `;
}

export async function loadBookingZohoSyncPayload(bookingId: string, client: DbLike = db) {
  await ensureZohoBookingColumns(client);
  const rows = await client.$queryRaw<Array<ZohoBookingSyncPayload>>`
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
      "zohoCustomerId",
      "zohoInvoiceId",
      "zohoPaymentId"
    FROM "Booking"
    WHERE id = ${bookingId}
    LIMIT 1
  `;
  return rows[0] || null;
}

export function resolveBookingZohoTransfer(
  booking: Pick<ZohoBookingSyncPayload, "billingDocumentType" | "paymentReceivedAt">
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

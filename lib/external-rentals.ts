import { db } from "@/lib/db";

export type ExternalRentalRecord = {
  id: string;
  bookingCode: string;
  supplierCompany: string;
  vehicleLabel: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startDate: Date;
  endDate: Date;
  pickupLocation: string;
  dropoffLocation: string;
  incomeAmount: number;
  expenseAmount: number;
  profitAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paymentReference: string | null;
  invoiceUrl: string | null;
  financialTransferStatus: string;
  notes: string | null;
  paymentReceivedAt: Date | null;
  pickedUpAt: Date | null;
  returnedAt: Date | null;
  pickupOdometerKm: number | null;
  pickupFuelLevel: number | null;
  pickupHasDamage: boolean | null;
  pickupDamageNotes: string | null;
  pickupAcceptedBy: string | null;
  pickupAcceptedAt: Date | null;
  pickupAgentNotes: string | null;
  pickupChecklistData: string | null;
  pickupChecklistDocumentUrl: string | null;
  pickupImageUrls: string | null;
  pickupNotes: string | null;
  returnOdometerKm: number | null;
  returnFuelLevel: number | null;
  returnHasDamage: boolean | null;
  returnDamageNotes: string | null;
  returnAcceptedBy: string | null;
  returnAcceptedAt: Date | null;
  returnAgentNotes: string | null;
  returnChecklistData: string | null;
  returnChecklistDocumentUrl: string | null;
  returnImageUrls: string | null;
  returnLateCharge: number | null;
  returnFuelCharge: number | null;
  returnDamageCharge: number | null;
  closeoutPaymentDueAt: Date | null;
  closeoutPaymentReceivedAt: Date | null;
  returnNotes: string | null;
  createdAt: Date;
  emailSentAt: Date | null;
  transferredAt: Date | null;
};

export async function ensureExternalRentalTable() {
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ExternalRentalBooking" (
      id TEXT PRIMARY KEY,
      "bookingCode" TEXT NOT NULL UNIQUE,
      "supplierCompany" TEXT NOT NULL,
      "vehicleLabel" TEXT NOT NULL,
      "customerName" TEXT NOT NULL,
      "customerEmail" TEXT NOT NULL,
      "customerPhone" TEXT NOT NULL,
      "startDate" TIMESTAMP NOT NULL,
      "endDate" TIMESTAMP NOT NULL,
      "pickupLocation" TEXT NOT NULL,
      "dropoffLocation" TEXT NOT NULL,
      "incomeAmount" INTEGER NOT NULL,
      "expenseAmount" INTEGER NOT NULL,
      "profitAmount" INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'CONFIRMED',
      "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
      "paymentMethod" TEXT NULL,
      "paymentReference" TEXT NULL,
      "invoiceUrl" TEXT NULL,
      "financialTransferStatus" TEXT NOT NULL DEFAULT 'PENDING',
      notes TEXT,
      "paymentReceivedAt" TIMESTAMP NULL,
      "pickedUpAt" TIMESTAMP NULL,
      "returnedAt" TIMESTAMP NULL,
      "pickupOdometerKm" INTEGER NULL,
      "pickupFuelLevel" INTEGER NULL,
      "pickupHasDamage" BOOLEAN NULL,
      "pickupDamageNotes" TEXT NULL,
      "pickupAcceptedBy" TEXT NULL,
      "pickupAcceptedAt" TIMESTAMP NULL,
      "pickupAgentNotes" TEXT NULL,
      "pickupChecklistData" TEXT NULL,
      "pickupChecklistDocumentUrl" TEXT NULL,
      "pickupImageUrls" TEXT NULL,
      "pickupNotes" TEXT NULL,
      "returnOdometerKm" INTEGER NULL,
      "returnFuelLevel" INTEGER NULL,
      "returnHasDamage" BOOLEAN NULL,
      "returnDamageNotes" TEXT NULL,
      "returnAcceptedBy" TEXT NULL,
      "returnAcceptedAt" TIMESTAMP NULL,
      "returnAgentNotes" TEXT NULL,
      "returnChecklistData" TEXT NULL,
      "returnChecklistDocumentUrl" TEXT NULL,
      "returnImageUrls" TEXT NULL,
      "returnLateCharge" INTEGER NULL,
      "returnFuelCharge" INTEGER NULL,
      "returnDamageCharge" INTEGER NULL,
      "closeoutPaymentDueAt" TIMESTAMP NULL,
      "closeoutPaymentReceivedAt" TIMESTAMP NULL,
      "returnNotes" TEXT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "emailSentAt" TIMESTAMP NULL,
      "transferredAt" TIMESTAMP NULL
    )
  `);

  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID'
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "paymentReference" TEXT NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "invoiceUrl" TEXT NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "paymentReceivedAt" TIMESTAMP NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "pickedUpAt" TIMESTAMP NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "returnedAt" TIMESTAMP NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "pickupNotes" TEXT NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "pickupOdometerKm" INTEGER NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "pickupFuelLevel" INTEGER NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "pickupHasDamage" BOOLEAN NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "pickupDamageNotes" TEXT NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "pickupAcceptedBy" TEXT NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "pickupAcceptedAt" TIMESTAMP NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "pickupAgentNotes" TEXT NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "pickupChecklistData" TEXT NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "pickupChecklistDocumentUrl" TEXT NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "pickupImageUrls" TEXT NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "returnNotes" TEXT NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "returnOdometerKm" INTEGER NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "returnFuelLevel" INTEGER NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "returnHasDamage" BOOLEAN NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "returnDamageNotes" TEXT NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "returnAcceptedBy" TEXT NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "returnAcceptedAt" TIMESTAMP NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "returnAgentNotes" TEXT NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "returnChecklistData" TEXT NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "returnChecklistDocumentUrl" TEXT NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "returnImageUrls" TEXT NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "returnLateCharge" INTEGER NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "returnFuelCharge" INTEGER NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "returnDamageCharge" INTEGER NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "closeoutPaymentDueAt" TIMESTAMP NULL
  `);
  await db.$executeRawUnsafe(`
    ALTER TABLE "ExternalRentalBooking"
    ADD COLUMN IF NOT EXISTS "closeoutPaymentReceivedAt" TIMESTAMP NULL
  `);

  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ExternalRentalBooking_createdAt_idx"
    ON "ExternalRentalBooking" ("createdAt" DESC)
  `);
  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ExternalRentalBooking_startDate_idx"
    ON "ExternalRentalBooking" ("startDate", "endDate")
  `);
  await db.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ExternalRentalBooking_transfer_idx"
    ON "ExternalRentalBooking" ("financialTransferStatus", "createdAt" DESC)
  `);
}

export async function getExternalRentalRecords(start: Date, end: Date) {
  await ensureExternalRentalTable();
  return db.$queryRaw<ExternalRentalRecord[]>`
    SELECT
      id,
      "bookingCode",
      "supplierCompany",
      "vehicleLabel",
      "customerName",
      "customerEmail",
      "customerPhone",
      "startDate",
      "endDate",
      "pickupLocation",
      "dropoffLocation",
      "incomeAmount",
      "expenseAmount",
      "profitAmount",
      status,
      "paymentStatus",
      "paymentMethod",
      "paymentReference",
      "invoiceUrl",
      "financialTransferStatus",
      notes,
      "paymentReceivedAt",
      "pickedUpAt",
      "returnedAt",
      "pickupOdometerKm",
      "pickupFuelLevel",
      "pickupHasDamage",
      "pickupDamageNotes",
      "pickupAcceptedBy",
      "pickupAcceptedAt",
      "pickupAgentNotes",
      "pickupChecklistData",
      "pickupChecklistDocumentUrl",
      "pickupImageUrls",
      "pickupNotes",
      "returnOdometerKm",
      "returnFuelLevel",
      "returnHasDamage",
      "returnDamageNotes",
      "returnAcceptedBy",
      "returnAcceptedAt",
      "returnAgentNotes",
      "returnChecklistData",
      "returnChecklistDocumentUrl",
      "returnImageUrls",
      "returnLateCharge",
      "returnFuelCharge",
      "returnDamageCharge",
      "closeoutPaymentDueAt",
      "closeoutPaymentReceivedAt",
      "returnNotes",
      "createdAt",
      "emailSentAt",
      "transferredAt"
    FROM "ExternalRentalBooking"
    WHERE "createdAt" >= ${start}
      AND "createdAt" <= ${end}
    ORDER BY "createdAt" DESC
  `;
}

export async function getExternalRentalSummary(start: Date, end: Date) {
  await ensureExternalRentalTable();
  const rows = await db.$queryRaw<Array<{
    totalIncome: number | null;
    totalExpense: number | null;
    totalProfit: number | null;
    totalCount: number | null;
    pendingTransferCount: number | null;
  }>>`
    SELECT
      COALESCE(SUM("incomeAmount"), 0) AS "totalIncome",
      COALESCE(SUM("expenseAmount"), 0) AS "totalExpense",
      COALESCE(SUM("profitAmount"), 0) AS "totalProfit",
      COUNT(*)::int AS "totalCount",
      COUNT(*) FILTER (WHERE "financialTransferStatus" = 'PENDING')::int AS "pendingTransferCount"
    FROM "ExternalRentalBooking"
    WHERE "createdAt" >= ${start}
      AND "createdAt" <= ${end}
  `;

  return rows[0] || {
    totalIncome: 0,
    totalExpense: 0,
    totalProfit: 0,
    totalCount: 0,
    pendingTransferCount: 0,
  };
}

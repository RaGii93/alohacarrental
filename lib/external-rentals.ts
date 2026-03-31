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
  financialTransferStatus: string;
  notes: string | null;
  paymentReceivedAt: Date | null;
  pickedUpAt: Date | null;
  returnedAt: Date | null;
  pickupNotes: string | null;
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
      "financialTransferStatus" TEXT NOT NULL DEFAULT 'PENDING',
      notes TEXT,
      "paymentReceivedAt" TIMESTAMP NULL,
      "pickedUpAt" TIMESTAMP NULL,
      "returnedAt" TIMESTAMP NULL,
      "pickupNotes" TEXT NULL,
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
    ADD COLUMN IF NOT EXISTS "returnNotes" TEXT NULL
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
      "financialTransferStatus",
      notes,
      "paymentReceivedAt",
      "pickedUpAt",
      "returnedAt",
      "pickupNotes",
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

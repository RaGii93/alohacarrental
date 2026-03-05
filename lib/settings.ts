import { db } from "@/lib/db";

const TAX_KEY = "tax_percentage";
const MIN_BOOKING_DAYS_KEY = "minimum_booking_days";
const QUICKBOOKS_REFRESH_TOKEN_KEY = "quickbooks_refresh_token";

function clampTaxPercentage(input: number): number {
  if (!Number.isFinite(input)) return 0;
  const clamped = Math.min(100, Math.max(0, input));
  return Math.round(clamped * 100) / 100;
}

function defaultTaxPercentage(): number {
  return clampTaxPercentage(Number(process.env.DEFAULT_TAX_PERCENTAGE || 0));
}

function clampMinBookingDays(input: number): number {
  if (!Number.isFinite(input)) return 1;
  return Math.max(1, Math.min(365, Math.round(input)));
}

function defaultMinBookingDays(): number {
  return clampMinBookingDays(Number(process.env.DEFAULT_MIN_BOOKING_DAYS || 1));
}

export function calculateTaxAmount(subtotalCents: number, taxPercentage: number): number {
  return Math.max(0, Math.round(Math.max(0, subtotalCents) * (clampTaxPercentage(taxPercentage) / 100)));
}

async function ensureSettingsTable(): Promise<void> {
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AppSetting" (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

export async function getTaxPercentage(): Promise<number> {
  await ensureSettingsTable();

  const rows = await db.$queryRaw<Array<{ value: string }>>`
    SELECT value FROM "AppSetting" WHERE key = ${TAX_KEY} LIMIT 1
  `;

  if (!rows[0]) return defaultTaxPercentage();
  return clampTaxPercentage(Number(rows[0].value));
}

export async function setTaxPercentage(nextTaxPercentage: number): Promise<number> {
  await ensureSettingsTable();

  const normalized = clampTaxPercentage(nextTaxPercentage);
  await db.$executeRaw`
    INSERT INTO "AppSetting" (key, value, "updatedAt")
    VALUES (${TAX_KEY}, ${String(normalized)}, NOW())
    ON CONFLICT (key)
    DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()
  `;

  return normalized;
}

export async function getMinBookingDays(): Promise<number> {
  await ensureSettingsTable();

  const rows = await db.$queryRaw<Array<{ value: string }>>`
    SELECT value FROM "AppSetting" WHERE key = ${MIN_BOOKING_DAYS_KEY} LIMIT 1
  `;

  if (!rows[0]) return defaultMinBookingDays();
  return clampMinBookingDays(Number(rows[0].value));
}

export async function setMinBookingDays(nextMinBookingDays: number): Promise<number> {
  await ensureSettingsTable();

  const normalized = clampMinBookingDays(nextMinBookingDays);
  await db.$executeRaw`
    INSERT INTO "AppSetting" (key, value, "updatedAt")
    VALUES (${MIN_BOOKING_DAYS_KEY}, ${String(normalized)}, NOW())
    ON CONFLICT (key)
    DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()
  `;

  return normalized;
}

export async function getQuickBooksRefreshToken(): Promise<string> {
  await ensureSettingsTable();

  const rows = await db.$queryRaw<Array<{ value: string }>>`
    SELECT value FROM "AppSetting" WHERE key = ${QUICKBOOKS_REFRESH_TOKEN_KEY} LIMIT 1
  `;

  return String(rows[0]?.value || "").trim();
}

export async function setQuickBooksRefreshToken(refreshToken: string): Promise<void> {
  await ensureSettingsTable();

  const normalized = String(refreshToken || "").trim();
  if (!normalized) return;

  await db.$executeRaw`
    INSERT INTO "AppSetting" (key, value, "updatedAt")
    VALUES (${QUICKBOOKS_REFRESH_TOKEN_KEY}, ${normalized}, NOW())
    ON CONFLICT (key)
    DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()
  `;
}

import { db } from "@/lib/db";
import { normalizeEmailLocale, type EmailLocale } from "@/lib/email-locale";

// Keep the customer's booking language for later staff actions and scheduled emails.
export async function resolveBookingEmailLocale(bookingId: string, fallbackLocale?: string): Promise<EmailLocale> {
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "BookingEmailPreference" (
      "bookingId" TEXT PRIMARY KEY REFERENCES "Booking"(id) ON DELETE CASCADE,
      locale TEXT NOT NULL DEFAULT 'en'
    )
  `);
  const fallback = normalizeEmailLocale(fallbackLocale);
  await db.$executeRaw`
    INSERT INTO "BookingEmailPreference" ("bookingId", locale)
    VALUES (${bookingId}, ${fallback})
    ON CONFLICT ("bookingId") DO NOTHING
  `;
  const rows = await db.$queryRaw<Array<{ locale: string }>>`
    SELECT locale FROM "BookingEmailPreference" WHERE "bookingId" = ${bookingId}
  `;
  return normalizeEmailLocale(rows[0]?.locale || fallback);
}

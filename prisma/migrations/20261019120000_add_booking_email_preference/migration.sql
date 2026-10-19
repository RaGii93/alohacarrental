CREATE TABLE IF NOT EXISTS "BookingEmailPreference" (
    "bookingId" TEXT PRIMARY KEY REFERENCES "Booking"("id") ON DELETE CASCADE,
    "locale" TEXT NOT NULL DEFAULT 'en'
);

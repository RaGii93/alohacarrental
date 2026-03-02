# EdgeRent Lite

Single-tenant vehicle rental platform built with Next.js 16, Prisma, and PostgreSQL.

---

## 1. What This Project Is

EdgeRent Lite is a **single-tenant** rental system.

- One deployment = one client/business
- Tenant identity/branding is configured via `.env` (`TENANT_*`)
- No in-app multi-tenant routing/partitioning

Use this repo as a base and deploy a separate instance per client.

---

## 2. Feature Summary

### Public

- Landing page with tenant branding and reviews
- 3-step booking wizard
  - date/time + pickup/dropoff location + availability
  - customer details + age/license validation + license upload
  - review/submit with extras + terms
- Booking success page with booking code
- Booking lookup page by booking code (`/book/review`)
- Customer review submission (requires valid booking code)

### Admin

- Secure login and session
- Booking operations:
  - confirm/decline
  - notes
  - add extras
  - apply discount code
  - send invoice payment request
  - create sales receipt (payment received)
  - receive invoice payment (without sales receipt)
  - update tax percentage in settings
  - update minimum booking duration in settings
- Dashboard tabs:
  - bookings, deliveries, returns, financial, fleet, vehicle management, reviews, settings
- Reviews moderation (show/hide on homepage)

### Billing Documents

- Invoice/payment request:
  - generates PDF
  - emails customer
  - does **not** mark payment received
  - does **not** change vehicle status
  - upserts QuickBooks customer + invoice when enabled
- Sales receipt:
  - generates PDF
  - marks payment received
  - sets vehicle to `ON_RENT`
  - emails customer
  - upserts QuickBooks customer + sales receipt when enabled
- Receive invoice payment (without sales receipt):
  - marks payment as received
  - keeps the billing document as invoice
  - upserts QuickBooks customer + invoice + payment when enabled
- Tax:
  - configurable percentage in admin settings
  - applied to booking totals
  - shown in invoice/sales receipt PDFs
- Minimum booking duration:
  - configurable in admin settings
  - enforced in availability search and booking creation

### File Handling

- Private Vercel Blob storage for licenses and generated docs
- Server-side proxy endpoint for stable preview/download:
  - `GET /api/blob/file?src=...`

### SEO / Metadata

- Locale-aware metadata (`en`, `nl`, `es`)
- Tenant-aware titles/descriptions and OG/Twitter values
- Canonical + hreflang alternates
- JSON-LD structured data (Organization, AutoRental, WebSite, Service)
- `robots.txt` + `sitemap.xml`

---

## 3. Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Prisma + PostgreSQL (Neon)
- next-intl
- Tailwind + shadcn/ui
- Vercel Blob (private)
- Resend (email)
- pdf-lib (PDF generation)

---

## 4. High-Level Architecture

### App layers

- `app/`:
  - route handlers
  - server components
  - metadata/sitemap/robots
- `actions/`:
  - server actions for booking/admin business logic
- `lib/`:
  - core services (db, tenant config, SEO, email, upload, session)
- `components/`:
  - booking/admin/UI building blocks
- `prisma/`:
  - schema + seed data

### Data flow example (booking submit)

1. Client fills wizard
2. Step 2 uploads file to `/api/upload/license`
3. Step 3 posts form to `createCategoryBookingAction`
4. Action validates, allocates vehicle in transaction, creates booking
5. Success page displays booking code

### Data flow example (review submit)

1. Client submits booking code + rating + comment to `/api/reviews`
2. API validates booking code and uniqueness (one review per booking)
3. Review is saved hidden (`isVisible=false`)
4. Owner receives email
5. Admin toggles visibility in reviews tab

---

## 5. Route Reference

### Public Pages

- `/{locale}` - landing page
- `/{locale}/book` - booking wizard
- `/{locale}/book/success/{bookingCode}` - booking success summary
- `/{locale}/book/review?code=...` - booking lookup page

### Admin Pages

- `/{locale}/admin/login` - admin login
- `/{locale}/admin` - dashboard
- `/{locale}/admin/bookings/{id}` - booking detail/actions
- `/{locale}/admin/vehicles` - vehicle list/management
- `/{locale}/admin/billing-required` - license suspension page

### API Routes

- `GET /api/reviews` - latest visible reviews
- `POST /api/reviews` - submit review (booking code required)
- `POST /api/upload/license` - upload driver license
- `GET /api/blob/file?src=...` - stream private blob file (inline/download)

### SEO Routes

- `GET /robots.txt`
- `GET /sitemap.xml`

---

## 6. Business Rules

### Booking

- Minimum renter age: 21
- License expiry must be valid beyond pickup date
- Date range must be valid (`end > start`)
- Booking initially created as `PENDING`
- Hold expiration for pending bookings
- Overlap/availability checks prevent double booking

### Vehicle statuses

- `ACTIVE`
- `ON_RENT`
- `MAINTENANCE`
- `INACTIVE`

Only valid/available statuses are selectable by flow logic.

### Reviews

- Customer can submit only if booking code exists
- Exactly one review per booking (DB constraint)
- Reviews are hidden by default
- Admin explicitly publishes/hides reviews

### Billing documents

- Invoice payment request and sales receipt are separate actions
- Sales receipt action marks payment received and updates vehicle status

---

## 7. Data Model (Important Entities)

### `Booking`

Includes:

- customer identity + contact
- license metadata and uploaded document URL
- pickup/dropoff location references and labels
- pricing totals
- status + booking code + hold expiry
- invoice URL and payment received timestamp
- relations:
  - category
  - vehicle
  - extras (`BookingExtra`)
  - discount (`BookingDiscount`)
  - review (`Review`)
  - audit logs

### `Review`

- `bookingId` (unique)
- `bookingCode`
- `customerName` (derived from booking)
- `rating` (1-5)
- `comment`
- `isVisible` default false

### `Extra` and `BookingExtra`

- Flat or daily pricing type
- Applied with quantity
- Stored as line totals for consistent billing

### `DiscountCode` and `BookingDiscount`

- Percentage-based discounts
- Applied to rental amount according to action logic

---

## 8. Environment Variables

Create `.env` at root.

## Required for runtime

```env
DATABASE_URL=postgresql://...
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
SESSION_SECRET=long-random-secret
RESEND_API_KEY=re_...
RESEND_FROM="EdgeRent <EdgeRent@endlessedgetechnology.com>"
NEXT_PUBLIC_APP_URL=https://your-domain.com
QUICKBOOKS_ENABLED=false
```

## Recommended / supported

```env
DATABASE_URL_UNPOOLED=postgresql://...
NEXT_PUBLIC_SITE_URL=https://your-domain.com
LICENSE_STATUS=ACTIVE
LICENSE_MESSAGE=Your license has been suspended...

TENANT_NAME="EdgeRent Lite"
TENANT_LOGO_URL="/logo.svg"
TENANT_PRIMARY_COLOR="#2563eb"
TENANT_PHONE="+599 700 0000"
TENANT_WHATSAPP="+599 700 0000"
TENANT_EMAIL="EdgeRent@endlessedgetechnology.com"
TENANT_ADDRESS="Kaya Example 100, Kralendijk, Bonaire"
TENANT_CURRENCY="USD"
TENANT_PAYMENT_INSTRUCTIONS="Please pay by bank transfer or card and include your booking code in the payment reference."
TENANT_TERMS_PDF_URL="/terms.pdf"
DEFAULT_TAX_PERCENTAGE=0
DEFAULT_MIN_BOOKING_DAYS=1
QUICKBOOKS_REALM_ID=
QUICKBOOKS_ACCESS_TOKEN=
QUICKBOOKS_CLIENT_ID=
QUICKBOOKS_CLIENT_SECRET=
QUICKBOOKS_REFRESH_TOKEN=
QUICKBOOKS_REDIRECT_URI=
QUICKBOOKS_OAUTH_STATE=
QUICKBOOKS_MINOR_VERSION=75
QUICKBOOKS_ITEM_ID=
QUICKBOOKS_ITEM_NAME="Vehicle Rental"
```

### Notes

- `TENANT_*` drives branding, email content, metadata, and JSON-LD
- `NEXT_PUBLIC_APP_URL` should match production canonical domain
- Use `QUICKBOOKS_ENABLED=true` only when QuickBooks credentials + item ID are set
- QuickBooks integration is QuickBooks Online API only
- Prefer OAuth refresh flow (`QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET`, `QUICKBOOKS_REFRESH_TOKEN`) over static access token
- OAuth helper endpoints in this app:
  - `GET /api/quickbooks/connect` (admin ROOT/OWNER only)
  - `GET /api/quickbooks/callback` (admin ROOT/OWNER only)
  - `GET /api/quickbooks/health` (admin ROOT/OWNER only)
  - `GET /api/quickbooks/items` (admin ROOT/OWNER only)
  - `GET /api/quickbooks/env-check` (admin ROOT/OWNER only; masked runtime env preview)
  - Set `QUICKBOOKS_REDIRECT_URI` to your callback URL, e.g. `https://your-domain.com/api/quickbooks/callback`
  - Optionally set `QUICKBOOKS_OAUTH_STATE` and use same value in Intuit app config
  - OAuth hardening implemented: per-request state nonce + PKCE (`S256`) on connect/callback

---

## 9. Setup / Local Development

1. Install deps:

```bash
npm install
```

2. Generate Prisma client:

```bash
npx prisma generate
```

3. Push DB schema:

```bash
npm run db:push
```

4. Seed data:

```bash
npm run db:seed
```

5. Start:

```bash
npm run dev
```

---

## 10. Scripts

- `npm run dev` - local server
- `npm run build` - production build
- `npm run start` - run built app
- `npm run lint` - lint
- `npm run db:push` - prisma db push
- `npm run db:seed` - seed script

---

## 11. Seed Data

Current seed populates:

- 5 admin users
- 5 categories
- 5 extras
- 5 discount codes
- 5 locations
- 10 vehicles
- 5 bookings
- 5 reviews

Use seed as demo/dev baseline, not production live data.

---

## 12. Security and Access

- Admin pages are protected by server-side auth guards
- Sessions use httpOnly cookies
- Uploads are validated by type/size/signature
- Blob storage is private; app streams files via proxy endpoint
- Admin routes are marked `noindex`

---

## 13. Internationalization

- Locales: `en`, `nl`, `es`
- Messages:
  - `messages/en.json`
  - `messages/nl.json`
  - `messages/es.json`
- Locale-aware URLs and metadata are configured through next-intl routing

---

## 14. SEO Details

Implemented in:

- `lib/seo.ts`
- `lib/structured-data.ts`
- page-level `generateMetadata`
- `app/robots.ts`
- `app/sitemap.ts`

What is generated:

- Title + description per locale
- Canonical + alternates
- OpenGraph/Twitter
- JSON-LD based on tenant profile

---

## 15. Operational Runbooks

### Add/modify Prisma schema

1. Update `prisma/schema.prisma`
2. Run:
   - `npm run db:push`
   - `npx prisma generate`
3. Restart dev server if needed

### Deploy

1. Set all env vars in Vercel
2. Build check locally:
   - `npm run build`
3. Deploy
4. If schema changed, run `db:push` against production DB

### Troubleshooting quick list

- Prisma field missing at runtime:
  - `npx prisma generate`
  - restart app
- File opens/downloads incorrectly:
  - verify URL is proxied via `/api/blob/file`
- 413 upload error:
  - ensure upload goes through API route, not oversized server action payload

---

## 16. Key Files

- `actions/booking.ts` - booking, billing docs, extras, discounts
- `actions/reviews.ts` - admin review visibility
- `app/api/reviews/route.ts` - review read/submit API
- `app/api/upload/license/route.ts` - file upload API
- `app/api/blob/file/route.ts` - private blob proxy
- `lib/email.ts` - email delivery + templates
- `lib/pdf.ts` - billing PDF renderer
- `lib/uploads.ts` - upload + signature validation
- `lib/tenant.ts` - tenant runtime config
- `lib/seo.ts` + `lib/structured-data.ts` - SEO/JSON-LD
- `prisma/schema.prisma` - source of truth for DB
- `prisma/seed.ts` - local/demo dataset

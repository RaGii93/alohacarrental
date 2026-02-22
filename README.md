# EdgeRent Lite - Single-Tenant Vehicle Rental Template

A production-ready Next.js 16 (App Router) + TypeScript template for building single-tenant vehicle rental applications. Designed to be duplicated per client with minimal configuration changes.

## 🎯 Architecture

**Single-Tenant Model**: Each client gets their own:
- Neon Postgres database (unique `DATABASE_URL`)
- Vercel deployment + custom domain
- Branding configuration (`tenant.config.ts` + env vars)
- i18n messages (EN/ES/NL)

NO multi-tenant logic inside one app.

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5+
- **Database**: Neon Postgres + Prisma ORM
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Forms**: react-hook-form + Zod validation
- **i18n**: next-intl (EN/ES/NL)
- **Notifications**: sonner
- **File Uploads**: Vercel Blob
- **Auth**: bcrypt + secure cookie-session (MVP)
- **PDF**: pdf-lib

## 📋 Features

### Public Pages
- **Landing Page** (`/en`, `/es`, `/nl`)
- **Booking Form** with vehicle selection, date picker, file uploads
- **Success Page** with booking reference

### Admin Panel
- **Login**: Email + password (bcrypt)
- **Dashboard**: Tabs for Pending / Confirmed / Declined bookings
- **Booking Detail**: View files, confirm/decline, add notes
- **Vehicle Management**: CRUD operations for fleet inventory
- **License Gate**: Suspend bookings/admin access if client doesn't pay

### Billing / License
- Env vars: `LICENSE_STATUS` (ACTIVE | SUSPENDED)
- When SUSPENDED:
  - Public booking disabled (Alert + contact CTA)
  - Admin actions blocked (redirect to billing page)
  - **Exception**: ROOT user bypasses license gate
- ROOT user: immutable super admin (`root` / `3dGe123$`)

### Internationalization
- Routes: `/en/book`, `/es/book`, `/nl/book`
- All UI text translatable via `next-intl useTranslations()`
- Locale switcher in header (persists cookie)
- Validation + system messages translated

### Availability / Overbooking Prevention
- Vehicle lock with `SELECT ... FOR UPDATE` in transaction
- Pending bookings hold vehicle for 2 hours (auto-cancel if expired)
- Prevents simultaneous double-booking

### Inventory
- Individual vehicles with daily rates, status, plate numbers
- Status: ACTIVE / MAINTENANCE / INACTIVE
- Only ACTIVE vehicles available for booking

## 📁 Project Structure

```
edge-rent-golden/
├── app/
│   ├── globals.css
│   ├── [locale]/
│   │   ├── layout.tsx              # Main layout with providers
│   │   ├── page.tsx                # Landing page
│   │   ├── book/
│   │   │   ├── page.tsx
│   │   │   └── success/[id]/page.tsx
│   │   └── admin/
│   │       ├── login/page.tsx
│   │       ├── page.tsx            # Dashboard
│   │       ├── bookings/[id]/page.tsx
│   │       ├── vehicles/page.tsx
│   │       └── billing-required/page.tsx
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── LanguageSwitcher.tsx
│   ├── booking/
│   │   └── BookingForm.tsx
│   └── admin/
│       ├── BookingsTable.tsx
│       ├── BookingDetailClient.tsx
│       ├── VehiclesTable.tsx
│       └── VehicleDialog.tsx
├── actions/
│   ├── auth.ts                     # Login/logout
│   ├── booking.ts                  # Booking CRUD + availability check
│   └── vehicles.ts                 # Vehicle management
├── lib/
│   ├── db.ts                       # Prisma singleton
│   ├── tenant.ts                   # Tenant config loader
│   ├── license.ts                  # License gate helpers
│   ├── session.ts                  # Cookie session (jwt)
│   ├── password.ts                 # bcrypt helpers
│   ├── validators.ts               # Zod schemas
│   ├── uploads.ts                  # File upload to Blob
│   ├── auth-guards.ts              # requireAdmin, requireRoot
│   ├── pdf.ts                      # Invoice PDF generation
│   └── utils.ts                    # cn() helper
├── messages/
│   ├── en.json
│   ├── es.json
│   └── nl.json
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── middleware.ts                   # Locale routing + cookie handling
├── next-intl.config.ts
├── tenant.config.ts                # Client branding config
├── .env                            # (gitignored)
├── .env.example
└── README.md

```

## 🛠️ Setup

### 1. Prerequisites

- Node.js 18+
- pnpm (or npm)
- Neon PostgreSQL account
- Vercel account (for Blob storage)

### 2. Install Dependencies

```bash
cd edge-rent-golden

# pnpm (preferred)
pnpm install

# or npm
npm install
```

### 3. Database Setup

#### 3.1 Create Neon Postgres Database

1. Go to [neon.tech](https://neon.tech)
2. Create a project and database
3. Copy the connection string (includes `DATABASE_URL`)

#### 3.2 Configure `.env`

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"

BLOB_READ_WRITE_TOKEN="your_vercel_blob_token"

LICENSE_STATUS="ACTIVE"
SESSION_SECRET="change-me-in-production-minimum-32-chars"

# Tenant branding (override defaults in tenant.config.ts)
TENANT_NAME="GreatDeals"
TENANT_LOGO_URL="https://..."
TENANT_PRIMARY_COLOR="#2563eb"
TENANT_PHONE="+1 (555) 123-4567"
TENANT_WHATSAPP="+1 (555) 123-4567"
TENANT_EMAIL="contact@greatdeals.com"
TENANT_ADDRESS="123 Main St, City, State 12345"
TENANT_CURRENCY="USD"
```

#### 3.3 Run Migrations & Seed

```bash
# Generate Prisma Client
pnpm prisma generate

# Create tables in database
pnpm prisma migrate dev --name init

# Seed ROOT user + sample data
pnpm prisma db seed
```

Default ROOT user:
- **Email**: `root`
- **Password**: `3dGe123$`

### 4. Vercel Blob Token (File Uploads)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Settings → Storage → Create → Blob
3. Copy token into `BLOB_READ_WRITE_TOKEN`

### 5. Local Development

```bash
pnpm dev
```

Visit `http://localhost:3000/en`

**Admin Login**:  
URL: `http://localhost:3000/en/admin/login`  
Email: `root` | Password: `3dGe123$`

## 🔐 Authentication

### Session Management (JWT in httpOnly Cookie)

- `lib/session.ts` creates/verifies sessions
- Sessions stored in secure httpOnly cookies
- Expires after 24 hours
- Routes protected via `requireAdmin()` server-side guard

### Password Hashing

- Uses bcrypt (10 salt rounds)
- Passwords hashed at login time
- Compared during authentication

### ROOT User (Immutable)

The ROOT user (`root`) is auto-seeded and cannot be:
- Deleted
- Modified (email/role)
- Demoted

ROOT bypasses license suspension, allowing full admin access even when LICENSE_STATUS=SUSPENDED.

## 💳 Licensing / Billing Gate

### Environment Variables

```env
LICENSE_STATUS="ACTIVE"  # or "SUSPENDED"
LICENSE_MESSAGE="Your license has been suspended..."
```

### Behavior

**When LICENSE_STATUS = "ACTIVE"**:
- Public booking available
- admin actions available

**When LICENSE_STATUS = "SUSPENDED"**:
- Public booking shows Alert, form disabled → CTA (call/WhatsApp)
- `createBookingAction` returns error code `BOOKING_DISABLED`
- Admin pages redirect to `/[locale]/admin/billing-required`
- Admin actions (confirm/decline/vehicles) blocked server-side
- **EXCEPTION**: ROOT user can still log in and manage everything

### How to Suspend a Client

```bash
# In Vercel dashboard, set env var:
LICENSE_STATUS=SUSPENDED

# Redeploy
vercel deploy --prod
```

Or manually:
```bash
# Locally, update .env
LICENSE_STATUS="SUSPENDED"
pnpm dev
```

## 🚗 Inventory Management

### Vehicle Models

```prisma
Vehicle:
  - id (cuid)
  - name (e.g., "Mercedes S-Class #1")
  - plateNumber (unique, optional)
  - category (optional)
  - dailyRate (in cents)
  - status (ACTIVE | MAINTENANCE | INACTIVE)
  - notes
```

### Availability Logic

- Only ACTIVE vehicles can be booked
- Transaction with row lock prevents double-booking
- Pending bookings hold vehicle for 2 hours (auto-expire)
- Overlap check: `startDate < requestedEndDate AND endDate > requestedStartDate`

## 📝 Tenancy & Branding

### tenant.config.ts

```typescript
export const tenantConfig: TenantConfig = {
  tenantName: "GreatDeals",
  logoUrl: "https://...",
  primaryColor: "#2563eb",
  phone: "+1 (555) 123-4567",
  whatsapp: "+1 (555) 123-4567",
  email: "contact@greatdeals.com",
  address: "...",
  currency: "USD",
  paymentInstructions: "...",
};
```

### Env Overrides

Any value can be overridden via env vars:

```env
TENANT_NAME="FastCar"
TENANT_PRIMARY_COLOR="#ff6b35"
```

## 🌐 Internationalization (next-intl)

### Locales

- `en` (default)
- `es` (Spanish)
- `nl` (Dutch)

### URL Routing

- `/en/book` → English booking form
- `/es/book` → Spanish booking form
- `/nl/book` → Dutch booking form

### Translations

All UI text is in `messages/[locale].json`:

```json
{
  "nav": { "booking": "Book a Vehicle" },
  "booking": { "title": "Book a Vehicle", "errors": { ... } }
}
```

Access via `useTranslations()`:

```tsx
const t = useTranslations();
<h1>{t("booking.title")}</h1>
```

### Language Switcher

Header component (`LanguageSwitcher.tsx`) switches locale and persists cookie.

## 📤 File Uploads

### Vercel Blob

- Upload destination for driver's licenses + payment proofs
- Max 8MB per file
- Allowed types: JPG, PNG, PDF

### Storage

- Only URLs stored in database (not files)
- Admin can view/download files via links
- Success page shows "Uploaded" indicator

## 📋 Booking Flow

1. **Customer Visits `/[locale]/book`**
   - Lists ACTIVE vehicles
   - Fills form: name, email, phone, vehicle, dates, files
   - Submits via `createBookingAction`

2. **Server-Side Validation**
   - Zod validation
   - License check (allow if ACTIVE or ROOT)
   - Vehicle exists & ACTIVE
   - Availability check (transaction lock)

3. **Booking Created (PENDING)**
   - Status: PENDING
   - holdExpiresAt: now + 2 hours
   - Files uploaded to Blob
   - Redirect to `/[locale]/book/success/[id]`

4. **Admin Reviews**
   - Dashboard shows PENDING bookings
   - Click booking → detail page
   - Confirm or Decline

5. **Confirm**
   - Status → CONFIRMED
   - Audit log created

6. **Expire**
   - If PENDING and holdExpiresAt < now
   - Status → CANCELLED (via `cancelExpiredHolds()`)

## 🚀 Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Environment Variables (Vercel)

1. Go to project Settings → Environment Variables
2. Add all vars from `.env.example`:
   - `DATABASE_URL`
   - `BLOB_READ_WRITE_TOKEN`
   - `LICENSE_STATUS`
   - `SESSION_SECRET`
   - Tenant vars (TENANT_NAME, TENANT_EMAIL, etc.)

3. Redeploy: `vercel --prod`

## 🔀 Duplicating for a New Client

### Quick Clone Process

```bash
# 1. Clone repo (or duplicate via GitHub)
git clone https://github.com/YOUR_ORG/edge-rent-golden.git GreatDeals
cd GreatDeals

# 2. Update package.json
# - Change "name": "edge-rent-golden" to "edge-rent-golden-greatdeals"

# 3. Create new Neon database for client
# - Go to neon.tech, create new project
# - Copy DATABASE_URL

# 4. Create new .env file
cp .env.example .env
# Edit .env with client's DATABASE_URL + branding

# 5. Run migrations
pnpm prisma migrate deploy  # or 'migrate dev' for first setup
pnpm prisma db seed

# 6. Deploy to Vercel
vercel --prod

# Set env vars in Vercel dashboard
# Redeploy
vercel --prod
```

### Changes Per Client

**Minimal changes required**:

1. `DATABASE_URL` (new Neon database)
2. `TENANT_*` env vars (branding)
3. `LICENSE_STATUS` (ACTIVE for new clients)
4. `SESSION_SECRET` (generate new unique value)
5. `BLOB_READ_WRITE_TOKEN` (client's Vercel Blob token)

**No code changes needed** (all config via env vars + tenant.config.ts).

## 📊 Database Schema

### AdminUser

```prisma
- id (cuid)
- email (unique)
- passwordHash
- role (ROOT | OWNER | STAFF)
- createdAt
- bookings []
- auditLogs []
```

### Vehicle

```prisma
- id (cuid)
- name
- plateNumber (unique, optional)
- category (optional)
- dailyRate (in cents)
- status (ACTIVE | MAINTENANCE | INACTIVE)
- notes (optional)
- createdAt
- bookings []
```

### Booking

```prisma
- id (cuid)
- vehicleId (FK)
- vehicle Vehicle
- customerName
- customerEmail
- customerPhone
- startDate
- endDate (exclusive for overlap logic)
- pickupLocation (optional)
- dropoffLocation (optional)
- totalAmount (in cents)
- status (PENDING | CONFIRMED | DECLINED | CANCELLED)
- holdExpiresAt (default: now + 2h)
- paymentProofUrl (optional)
- driverLicenseUrl (optional)
- notes (optional)
- invoiceUrl (optional)
- createdAt
- auditLogs []
```

### AuditLog

```prisma
- id (cuid)
- adminUserId (FK)
- adminUser AdminUser
- action (string, e.g., "BOOKING_CONFIRMED")
- bookingId (FK, optional)
- booking Booking
- createdAt
```

## 🔧 Troubleshooting

### Database Connection Error

**Error**: `P1000: Can't reach database server`

**Solution**:
- Verify `DATABASE_URL` in `.env`
- Check Neon firewall allows your IP
- Neon dashboard → Connection string → copy latest

### Session Expires Immediately

**Error**: Session token not persisting

**Solution**:
- Verify `SESSION_SECRET` is set in `.env` (min 32 chars)
- Check httpOnly cookie is set (Safari private mode may block)
- Re-login in a standard browser tab

### File Upload Fails

**Error**: `Failed to upload file` or 413 (payload too large)

**Solution**:
- Check file < 8MB
- Verify `BLOB_READ_WRITE_TOKEN` is valid
- Test token in Vercel dashboard → Storage → Blob

### License Gate Not Working

**Error**: Booking still allowed when LICENSE_STATUS=SUSPENDED

**Solution**:
- Rebuild: `pnpm dev` (or redeploy Vercel)
- Check `.env` or Vercel env vars
- Restart dev server after env change

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `middleware.ts` | Locale routing + cookie persistence |
| `app/[locale]/layout.tsx` | Root layout with providers (Sonner, next-intl) |
| `lib/db.ts` | Prisma singleton (prevent connection pool leak) |
| `lib/session.ts` | JWT session creation/verification |
| `lib/license.ts` | License gate helpers |
| `actions/auth.ts` | Login/logout server actions |
| `actions/booking.ts` | Booking CRUD + availability logic |
| `actions/vehicles.ts` | Vehicle management actions |
| `prisma/schema.prisma` | Database schema (models + indexes) |
| `prisma/seed.ts` | Seeds ROOT user + sample data |
| `tenant.config.ts` | Tenant branding config (overridable via env) |
| `messages/[locale].json` | i18n translations |

## 🎯 Next Featuresto Add (Optional)

- Invoice PDF generation + email
- Payment integration (Stripe)
- SMS notifications (Twilio)
- Admin users management (CRUD)
- Booking notes/communication history
- Export bookings (CSV)
- Analytics dashboard
- Multi-day rate discounts
- Customer self-service cancellation

## 📄 License

MIT

## 🤝 Support

For issues or questions:
1. Check `.env` configuration
2. Review database schema in Prisma
3. Inspect server logs (Vercel)
4. Check browser console for client errors

---

**Built with ❤️ using Next.js, Prisma, and shadcn/ui**

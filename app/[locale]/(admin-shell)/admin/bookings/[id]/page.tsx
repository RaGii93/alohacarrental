import { db } from "@/lib/db";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BookingDetailClient } from "@/components/admin/BookingDetailClient";
import { getInvoiceProvider, getTaxPercentage, getVehicleRatesIncludeTax } from "@/lib/settings";
import { requireAdminSection } from "@/app/[locale]/admin/_lib";
import { ensureQuickBooksBookingColumns } from "@/lib/quickbooks-bookings";
import { ensureZohoBookingColumns } from "@/lib/zoho-bookings";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations();
  const auth = await requireAdminSection(locale, "bookings");
  await ensureQuickBooksBookingColumns();
  await ensureZohoBookingColumns();

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      vehicle: true,
      category: true,
      pickupLocationRef: true,
      dropoffLocationRef: true,
      inspectionPhotos: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!booking) {
    return (
      <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <p>{t("errors.notFound")}</p>
      </div>
    );
  }

  let bookingExtras: any[] = [];
  try {
    bookingExtras = await db.$queryRaw<Array<any>>`
      SELECT be.id, be.quantity, be."lineTotal", e.id as "extraId", e.name, e."pricingType", e.amount
      FROM "BookingExtra" be
      JOIN "Extra" e ON e.id = be."extraId"
      WHERE be."bookingId" = ${id}
      ORDER BY be."createdAt" DESC
    `;
  } catch {
    bookingExtras = [];
  }

  let bookingDiscount: any = null;
  try {
    const rows = await db.$queryRaw<Array<any>>`
      SELECT bd.id, bd.percentage, bd.amount, dc.id as "discountCodeId", dc.code
      FROM "BookingDiscount" bd
      JOIN "DiscountCode" dc ON dc.id = bd."discountCodeId"
      WHERE bd."bookingId" = ${id}
      LIMIT 1
    `;
    bookingDiscount = rows[0] || null;
  } catch {
    bookingDiscount = null;
  }

  const bookingWithAdjustments = {
    ...booking,
    bookingExtras: bookingExtras.map((line) => ({
      id: line.id,
      quantity: line.quantity,
      lineTotal: line.lineTotal,
      extra: {
        id: line.extraId,
        name: line.name,
        pricingType: line.pricingType,
        amount: line.amount,
      },
    })),
    bookingDiscount: bookingDiscount
      ? {
          id: bookingDiscount.id,
          percentage: bookingDiscount.percentage,
          amount: bookingDiscount.amount,
          discountCode: {
            id: bookingDiscount.discountCodeId,
            code: bookingDiscount.code,
          },
        }
      : null,
  };
  let operational: { deliveredAt: Date | null; returnedAt: Date | null } = {
    deliveredAt: null,
    returnedAt: null,
  };
  try {
    const rows = await db.$queryRaw<Array<{ deliveredAt: Date | null; returnedAt: Date | null }>>`
      SELECT "deliveredAt", "returnedAt"
      FROM "Booking"
      WHERE id = ${id}
      LIMIT 1
    `;
    if (rows[0]) operational = rows[0];
  } catch {
    operational = { deliveredAt: null, returnedAt: null };
  }

  let quickBooksState: any = {
    billingDocumentType: null,
    quickBooksTransferStatus: null,
    quickBooksDocumentType: null,
    quickBooksLastError: null,
    quickBooksSyncRequestedAt: null,
    quickBooksSyncedAt: null,
  };
  try {
    const rows = await db.$queryRaw<Array<any>>`
      SELECT
        "billingDocumentType",
        "quickBooksTransferStatus",
        "quickBooksDocumentType",
        "quickBooksLastError",
        "quickBooksSyncRequestedAt",
        "quickBooksSyncedAt"
      FROM "Booking"
      WHERE id = ${id}
      LIMIT 1
    `;
    if (rows[0]) quickBooksState = rows[0];
  } catch {
    quickBooksState = {
      billingDocumentType: null,
      quickBooksTransferStatus: null,
      quickBooksDocumentType: null,
      quickBooksLastError: null,
      quickBooksSyncRequestedAt: null,
      quickBooksSyncedAt: null,
    };
  }

  let zohoState: any = {
    zohoTransferStatus: null,
    zohoDocumentType: null,
    zohoLastError: null,
    zohoSyncRequestedAt: null,
    zohoSyncedAt: null,
  };
  try {
    const rows = await db.$queryRaw<Array<any>>`
      SELECT
        "zohoTransferStatus",
        "zohoDocumentType",
        "zohoLastError",
        "zohoSyncRequestedAt",
        "zohoSyncedAt"
      FROM "Booking"
      WHERE id = ${id}
      LIMIT 1
    `;
    if (rows[0]) zohoState = rows[0];
  } catch {
    zohoState = {
      zohoTransferStatus: null,
      zohoDocumentType: null,
      zohoLastError: null,
      zohoSyncRequestedAt: null,
      zohoSyncedAt: null,
    };
  }

  let extras: any[] = [];
  if ((db as any).extra && typeof (db as any).extra.findMany === "function") {
    extras = await (db as any).extra.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  } else {
    try {
      extras = await db.$queryRaw<Array<any>>`
        SELECT id, name, description, "pricingType", amount, "isActive"
        FROM "Extra"
        WHERE "isActive" = true
        ORDER BY name ASC
      `;
    } catch {
      extras = [];
    }
  }

  let discountCodes: any[] = [];
  if ((db as any).discountCode && typeof (db as any).discountCode.findMany === "function") {
    discountCodes = await (db as any).discountCode.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  } else {
    try {
      discountCodes = await db.$queryRaw<Array<any>>`
        SELECT id, code, percentage
        FROM "DiscountCode"
        WHERE "isActive" = true
        ORDER BY "createdAt" DESC
        LIMIT 100
      `;
    } catch {
      discountCodes = [];
    }
  }
  const [taxPercentage, vehicleRatesIncludeTax, invoiceProvider] = await Promise.all([
    getTaxPercentage(),
    getVehicleRatesIncludeTax(),
    getInvoiceProvider(),
  ]);

  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <Link href={`/${locale}/admin/bookings`}>
        <button className="mb-6 text-slate-700 hover:text-slate-900 hover:underline">← {t("common.back")}</button>
      </Link>

      <BookingDetailClient
        booking={{ ...bookingWithAdjustments, ...operational, ...quickBooksState, ...zohoState }}
        locale={locale}
        extras={extras}
        discountCodes={discountCodes}
        taxPercentage={taxPercentage}
        vehicleRatesIncludeTax={vehicleRatesIncludeTax}
        accountingProvider={invoiceProvider}
        role={auth.admin.role}
      />
    </div>
  );
}

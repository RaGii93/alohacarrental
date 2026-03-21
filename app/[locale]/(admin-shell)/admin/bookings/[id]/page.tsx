import { db } from "@/lib/db";
import Link from "next/link";
import { BookingDetailClient } from "@/components/admin/BookingDetailClient";
import { getTaxPercentage } from "@/lib/settings";
import { requireAdminSection } from "@/app/[locale]/admin/_lib";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  await requireAdminSection(locale, "bookings");

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      vehicle: true,
      category: true,
      pickupLocationRef: true,
      dropoffLocationRef: true,
    },
  });

  if (!booking) {
    return (
      <div className="w-full px-4 py-12 sm:px-6 lg:px-8">
        <p>Booking not found</p>
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
  const taxPercentage = await getTaxPercentage();

  return (
    <div className="w-full px-4 py-12 sm:px-6 lg:px-8">
      <Link href={`/${locale}/admin/bookings`}>
        <button className="text-blue-600 hover:underline mb-6">← Back</button>
      </Link>

      <BookingDetailClient
        booking={{ ...bookingWithAdjustments, ...operational }}
        locale={locale}
        extras={extras}
        discountCodes={discountCodes}
        taxPercentage={taxPercentage}
      />
    </div>
  );
}

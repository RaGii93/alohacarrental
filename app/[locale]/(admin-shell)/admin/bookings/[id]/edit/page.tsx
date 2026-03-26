import Link from "next/link";
import { redirect } from "next/navigation";
import { BookingEditForm } from "@/components/admin/BookingEditForm";
import { db } from "@/lib/db";
import { requireAdminSection } from "@/app/[locale]/admin/_lib";
import { getTaxPercentage, getVehicleRatesIncludeTax } from "@/lib/settings";

function toLocalDateTimeInput(date: Date | null | undefined) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toLocalDateInput(date: Date | null | undefined) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function BookingEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const auth = await requireAdminSection(locale, "bookings");

  if (auth.admin.role !== "ROOT" && auth.admin.role !== "OWNER") {
    redirect(`/${locale}/admin/bookings/${id}`);
  }

  const booking = await db.booking.findUnique({
    where: { id },
    select: {
      id: true,
      bookingCode: true,
      categoryId: true,
      vehicleId: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      flightNumber: true,
      birthDate: true,
      driverLicenseNumber: true,
      licenseExpiryDate: true,
      startDate: true,
      endDate: true,
      pickupLocationId: true,
      dropoffLocationId: true,
      notes: true,
    },
  });

  if (!booking) {
    redirect(`/${locale}/admin/bookings/${id}`);
  }

  const [categories, locations, vehicles, taxPercentage, vehicleRatesIncludeTax] = await Promise.all([
    db.vehicleCategory.findMany({
      where: { isActive: true },
      select: { id: true, name: true, dailyRate: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.location.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.vehicle.findMany({
      where: booking.vehicleId
        ? {
            OR: [
              { status: "ACTIVE" },
              { id: booking.vehicleId },
            ],
          }
        : { status: "ACTIVE" },
      select: { id: true, name: true, categoryId: true, plateNumber: true },
      orderBy: { name: "asc" },
    }),
    getTaxPercentage(),
    getVehicleRatesIncludeTax(),
  ]);

  let bookingExtras: Array<{ id: string; quantity: number; lineTotal: number; extraId: string; name: string; pricingType: "DAILY" | "FLAT"; amount: number }> = [];
  try {
    bookingExtras = await db.$queryRaw<Array<any>>`
      SELECT be.id, be.quantity, be."lineTotal", e.id as "extraId", e.name, e."pricingType", e.amount
      FROM "BookingExtra" be
      JOIN "Extra" e ON e.id = be."extraId"
      WHERE be."bookingId" = ${id}
      ORDER BY be."createdAt" ASC
    `;
  } catch {
    bookingExtras = [];
  }

  let bookingDiscount: { id: string; percentage: number; amount: number; code: string } | null = null;
  try {
    const rows = await db.$queryRaw<Array<any>>`
      SELECT bd.id, bd.percentage, bd.amount, dc.code
      FROM "BookingDiscount" bd
      JOIN "DiscountCode" dc ON dc.id = bd."discountCodeId"
      WHERE bd."bookingId" = ${id}
      LIMIT 1
    `;
    bookingDiscount = rows[0] || null;
  } catch {
    bookingDiscount = null;
  }

  let availableExtras: Array<{ id: string; name: string; pricingType: "DAILY" | "FLAT"; amount: number; description?: string | null }> = [];
  if ((db as any).extra && typeof (db as any).extra.findMany === "function") {
    try {
      availableExtras = await (db as any).extra.findMany({
        where: { isActive: true },
        select: { id: true, name: true, pricingType: true, amount: true, description: true },
        orderBy: { name: "asc" },
      });
    } catch {
      availableExtras = [];
    }
  } else {
    try {
      availableExtras = await db.$queryRaw<Array<any>>`
        SELECT id, name, "pricingType", amount, description
        FROM "Extra"
        WHERE "isActive" = true
        ORDER BY name ASC
      `;
    } catch {
      availableExtras = [];
    }
  }

  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <Link href={`/${locale}/admin/bookings/${id}`}>
        <button className="mb-6 text-sm font-medium text-slate-700 hover:text-slate-900 hover:underline">← Back to booking</button>
      </Link>

      <div className="mb-8 rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(135deg,#ffffff,#f5f8ff)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Booking Editor</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Edit Booking {booking.bookingCode}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Update the renter, schedule, category, and routing details from one structured workspace. When you save, availability is checked again and totals are recalculated automatically.
            </p>
          </div>
        </div>
      </div>

      <BookingEditForm
        locale={locale}
        booking={{
          id: booking.id,
          bookingCode: booking.bookingCode,
          categoryId: booking.categoryId,
          vehicleId: booking.vehicleId || "",
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone,
          flightNumber: booking.flightNumber || "",
          birthDate: toLocalDateInput(booking.birthDate),
          driverLicenseNumber: booking.driverLicenseNumber || "",
          licenseExpiryDate: toLocalDateInput(booking.licenseExpiryDate),
          startDate: toLocalDateTimeInput(booking.startDate),
          endDate: toLocalDateTimeInput(booking.endDate),
          pickupLocationId: booking.pickupLocationId || "",
          dropoffLocationId: booking.dropoffLocationId || "",
          notes: booking.notes || "",
        }}
        categories={categories}
        locations={locations}
        vehicles={vehicles}
        bookingExtras={bookingExtras}
        availableExtras={availableExtras}
        bookingDiscount={bookingDiscount}
        taxPercentage={taxPercentage}
        vehicleRatesIncludeTax={vehicleRatesIncludeTax}
      />
    </div>
  );
}

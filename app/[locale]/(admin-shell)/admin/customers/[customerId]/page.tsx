import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import {
  ADMIN_PAGE_KICKER,
  ADMIN_PAGE_SHELL,
  ADMIN_PAGE_STACK,
  requireAdminSection,
} from "@/app/[locale]/admin/_lib";

type BookingDetailRow = {
  id: string;
  createdAt: Date;
  status: string;
  totalAmount: number;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  driverLicenseNumber: string | null;
  paymentReceivedAt: Date | null;
  closeoutPaymentReceivedAt: Date | null;
  returnLateCharge: number;
  returnFuelCharge: number;
  returnDamageCharge: number;
  vehicleName: string | null;
  categoryName: string | null;
};

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function parseCustomerKey(raw: string) {
  if (raw.startsWith("email:")) return { kind: "email" as const, value: raw.slice(6) };
  if (raw.startsWith("phone:")) return { kind: "phone" as const, value: raw.slice(6) };
  if (raw.startsWith("name:")) return { kind: "name" as const, value: raw.slice(5) };
  return null;
}

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ locale: string; customerId: string }>;
}) {
  const { locale, customerId } = await params;
  const decoded = decodeURIComponent(customerId);
  const customer = parseCustomerKey(decoded);
  const t = await getTranslations("admin.customers");

  await requireAdminSection(locale, "customers");

  if (!customer || !customer.value) {
    notFound();
  }

  const whereClause =
    customer.kind === "email"
      ? `LOWER(b."customerEmail") = $1`
      : customer.kind === "phone"
        ? `regexp_replace(COALESCE(b."customerPhone", ''), '[^0-9+]', '', 'g') = $1`
        : `LOWER(COALESCE(b."customerName", '')) = $1`;

  const bookings = await db.$queryRawUnsafe<BookingDetailRow[]>(
    `
      SELECT
        b.id,
        b."createdAt",
        b.status,
        b."totalAmount",
        b."customerName",
        NULLIF(b."customerEmail", '') AS "customerEmail",
        NULLIF(b."customerPhone", '') AS "customerPhone",
        NULLIF(b."driverLicenseNumber", '') AS "driverLicenseNumber",
        b."paymentReceivedAt",
        b."closeoutPaymentReceivedAt",
        COALESCE(b."returnLateCharge", 0) AS "returnLateCharge",
        COALESCE(b."returnFuelCharge", 0) AS "returnFuelCharge",
        COALESCE(b."returnDamageCharge", 0) AS "returnDamageCharge",
        v.name AS "vehicleName",
        c.name AS "categoryName"
      FROM "Booking" b
      LEFT JOIN "Vehicle" v ON v.id = b."vehicleId"
      LEFT JOIN "VehicleCategory" c ON c.id = b."categoryId"
      WHERE ${whereClause}
      ORDER BY b."createdAt" DESC
      LIMIT 200
    `,
    customer.value,
  );

  if (bookings.length === 0) {
    notFound();
  }

  const totalBookings = bookings.length;
  const totalRevenue = bookings.reduce((sum, booking) => {
    if (["DECLINED", "CANCELLED"].includes(booking.status)) return sum;
    return sum + Number(booking.totalAmount || 0);
  }, 0);

  const outstandingCount = bookings.filter((booking) => {
    if (["DECLINED", "CANCELLED"].includes(booking.status)) return false;
    if (!booking.paymentReceivedAt) return true;
    if (
      !booking.closeoutPaymentReceivedAt &&
      (Number(booking.returnLateCharge) > 0 || Number(booking.returnFuelCharge) > 0 || Number(booking.returnDamageCharge) > 0)
    ) {
      return true;
    }
    return false;
  }).length;

  const profile = bookings[0];

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_PAGE_STACK}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={ADMIN_PAGE_KICKER}>{t("kicker")}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{profile.customerName || t("common.unknown")}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {t("detail.subtitle")}
            </p>
          </div>
          <Link
            href={`/${locale}/admin/customers`}
            className="inline-flex h-9 items-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {t("actions.back")}
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{t("stats.bookings")}</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{totalBookings}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{t("stats.revenue")}</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{formatMoney(totalRevenue)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{t("stats.outstanding")}</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{outstandingCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{t("stats.license")}</p>
            <p className="mt-2 truncate text-sm font-semibold text-slate-800">{profile.driverLicenseNumber || "-"}</p>
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">{t("detail.contact")}</h2>
          <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            <p>{t("detail.email")}: {profile.customerEmail || "-"}</p>
            <p>{t("detail.phone")}: {profile.customerPhone || "-"}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.6rem] bg-white shadow-[0_24px_56px_-32px_hsl(215_28%_17%/0.12)] ring-1 ring-[hsl(215_25%_27%/0.05)]">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50/80 text-left text-xs uppercase tracking-[0.12em] text-slate-600">
              <tr>
                <th className="px-4 py-3">{t("detail.table.date")}</th>
                <th className="px-4 py-3">{t("detail.table.booking")}</th>
                <th className="px-4 py-3">{t("detail.table.vehicle")}</th>
                <th className="px-4 py-3">{t("detail.table.status")}</th>
                <th className="px-4 py-3">{t("detail.table.amount")}</th>
                <th className="px-4 py-3">{t("detail.table.outstanding")}</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const hasOutstanding =
                  !["DECLINED", "CANCELLED"].includes(booking.status) &&
                  (!booking.paymentReceivedAt ||
                    (!booking.closeoutPaymentReceivedAt &&
                      (Number(booking.returnLateCharge) > 0 ||
                        Number(booking.returnFuelCharge) > 0 ||
                        Number(booking.returnDamageCharge) > 0)));

                return (
                  <tr key={booking.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3">{new Date(booking.createdAt).toLocaleDateString("en-US")}</td>
                    <td className="px-4 py-3">
                      <Link href={`/${locale}/admin/bookings/${booking.id}`} className="font-semibold text-[hsl(var(--primary))] hover:underline">
                        {booking.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{booking.vehicleName || booking.categoryName || "-"}</td>
                    <td className="px-4 py-3">{booking.status}</td>
                    <td className="px-4 py-3">{formatMoney(Number(booking.totalAmount || 0))}</td>
                    <td className="px-4 py-3">{hasOutstanding ? t("common.yes") : t("common.no")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

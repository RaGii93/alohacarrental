import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import {
  ADMIN_PAGE_KICKER,
  ADMIN_PAGE_META_ROW,
  ADMIN_PAGE_META_TEXT,
  ADMIN_PAGE_PAGER,
  ADMIN_PAGE_PAGER_BUTTON,
  ADMIN_PAGE_PAGER_CURRENT,
  ADMIN_PAGE_PAGER_DISABLED,
  ADMIN_PAGE_ROWS_BUTTON,
  ADMIN_PAGE_ROWS_BUTTON_ACTIVE,
  ADMIN_PAGE_ROWS_BUTTON_IDLE,
  ADMIN_PAGE_ROWS_WRAP,
  ADMIN_PAGE_SHELL,
  ADMIN_PAGE_STACK,
  ADMIN_PAGE_SIZE_OPTIONS,
  requireAdminSection,
  toPageSize,
  toPositiveInt,
} from "@/app/[locale]/admin/_lib";
import { Input } from "@/components/ui/input";

const HIGH_VALUE_THRESHOLD_CENTS = 150000;
const INACTIVE_DAYS = 180;

const CUSTOMER_KEY_SQL = `
CASE
  WHEN COALESCE(NULLIF(LOWER(b."customerEmail"), ''), '') <> '' THEN CONCAT('email:', LOWER(b."customerEmail"))
  WHEN COALESCE(NULLIF(regexp_replace(COALESCE(b."customerPhone", ''), '[^0-9+]', '', 'g'), ''), '') <> ''
    THEN CONCAT('phone:', regexp_replace(COALESCE(b."customerPhone", ''), '[^0-9+]', '', 'g'))
  ELSE CONCAT('name:', LOWER(COALESCE(b."customerName", 'unknown')))
END
`;

type CustomerRow = {
  customerKey: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  driverLicenseNumber: string | null;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenueCents: number;
  lastBookingAt: Date | null;
  outstandingCount: number;
};

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default async function AdminCustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    customers_filter?: string;
    customers_page?: string;
    page_size?: string;
  }>;
}) {
  const { locale } = await params;
  const { q = "", customers_filter = "all", customers_page, page_size } = await searchParams;
  const t = await getTranslations("admin.customers");

  await requireAdminSection(locale, "customers");

  const search = q.trim();
  const filter = ["all", "repeat", "outstanding", "high_value", "inactive"].includes(customers_filter)
    ? customers_filter
    : "all";
  const pageSize = toPageSize(page_size);
  const page = toPositiveInt(customers_page);

  const filterClause =
    filter === "repeat"
      ? `AND grouped."totalBookings" >= 2`
      : filter === "outstanding"
        ? `AND grouped."outstandingCount" > 0`
        : filter === "high_value"
          ? `AND grouped."totalRevenueCents" >= ${HIGH_VALUE_THRESHOLD_CENTS}`
          : filter === "inactive"
            ? `AND grouped."lastBookingAt" < (NOW() - INTERVAL '${INACTIVE_DAYS} days')`
        : "";

  const searchClause = search
    ? `
      AND (
        grouped."customerName" ILIKE $1
        OR grouped."customerEmail" ILIKE $1
        OR grouped."customerPhone" ILIKE $1
        OR grouped."driverLicenseNumber" ILIKE $1
      )
    `
    : "";

  const wildcard = `%${search}%`;

  const countSql = `
    WITH grouped AS (
      SELECT
        ${CUSTOMER_KEY_SQL} AS "customerKey",
        MAX(b."customerName") AS "customerName",
        MAX(NULLIF(b."customerEmail", '')) AS "customerEmail",
        MAX(NULLIF(b."customerPhone", '')) AS "customerPhone",
        MAX(NULLIF(b."driverLicenseNumber", '')) AS "driverLicenseNumber",
        COUNT(*)::int AS "totalBookings",
        SUM(CASE WHEN b."status" IN ('DECLINED', 'CANCELLED') THEN 0 ELSE 1 END)::int AS "completedBookings",
        SUM(CASE WHEN b."status" IN ('DECLINED', 'CANCELLED') THEN 1 ELSE 0 END)::int AS "cancelledBookings",
        SUM(CASE WHEN b."status" IN ('DECLINED', 'CANCELLED') THEN 0 ELSE b."totalAmount" END)::bigint AS "totalRevenueCents",
        MAX(b."createdAt") AS "lastBookingAt",
        SUM(
          CASE
            WHEN b."status" IN ('DECLINED', 'CANCELLED') THEN 0
            WHEN b."paymentReceivedAt" IS NULL THEN 1
            WHEN b."closeoutPaymentReceivedAt" IS NULL
              AND (COALESCE(b."returnLateCharge", 0) > 0 OR COALESCE(b."returnFuelCharge", 0) > 0 OR COALESCE(b."returnDamageCharge", 0) > 0)
            THEN 1
            ELSE 0
          END
        )::int AS "outstandingCount"
      FROM "Booking" b
      GROUP BY 1
    )
    SELECT COUNT(*)::int AS "total"
    FROM grouped
    WHERE 1 = 1
    ${searchClause}
    ${filterClause}
  `;

  const rowsSql = `
    WITH grouped AS (
      SELECT
        ${CUSTOMER_KEY_SQL} AS "customerKey",
        MAX(b."customerName") AS "customerName",
        MAX(NULLIF(b."customerEmail", '')) AS "customerEmail",
        MAX(NULLIF(b."customerPhone", '')) AS "customerPhone",
        MAX(NULLIF(b."driverLicenseNumber", '')) AS "driverLicenseNumber",
        COUNT(*)::int AS "totalBookings",
        SUM(CASE WHEN b."status" IN ('DECLINED', 'CANCELLED') THEN 0 ELSE 1 END)::int AS "completedBookings",
        SUM(CASE WHEN b."status" IN ('DECLINED', 'CANCELLED') THEN 1 ELSE 0 END)::int AS "cancelledBookings",
        SUM(CASE WHEN b."status" IN ('DECLINED', 'CANCELLED') THEN 0 ELSE b."totalAmount" END)::bigint AS "totalRevenueCents",
        MAX(b."createdAt") AS "lastBookingAt",
        SUM(
          CASE
            WHEN b."status" IN ('DECLINED', 'CANCELLED') THEN 0
            WHEN b."paymentReceivedAt" IS NULL THEN 1
            WHEN b."closeoutPaymentReceivedAt" IS NULL
              AND (COALESCE(b."returnLateCharge", 0) > 0 OR COALESCE(b."returnFuelCharge", 0) > 0 OR COALESCE(b."returnDamageCharge", 0) > 0)
            THEN 1
            ELSE 0
          END
        )::int AS "outstandingCount"
      FROM "Booking" b
      GROUP BY 1
    )
    SELECT *
    FROM grouped
    WHERE 1 = 1
    ${searchClause}
    ${filterClause}
    ORDER BY "lastBookingAt" DESC NULLS LAST
    LIMIT $${search ? "2" : "1"} OFFSET $${search ? "3" : "2"}
  `;

  const countResult = search
    ? await db.$queryRawUnsafe<Array<{ total: number }>>(countSql, wildcard)
    : await db.$queryRawUnsafe<Array<{ total: number }>>(countSql);

  const total = countResult[0]?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const rows = search
    ? await db.$queryRawUnsafe<CustomerRow[]>(rowsSql, wildcard, pageSize, (safePage - 1) * pageSize)
    : await db.$queryRawUnsafe<CustomerRow[]>(rowsSql, pageSize, (safePage - 1) * pageSize);

  const startRow = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endRow = Math.min(total, safePage * pageSize);

  const buildHref = (updates: Record<string, string | number | undefined>) => {
    const qp = new URLSearchParams();
    if (search) qp.set("q", search);
    qp.set("customers_filter", filter);
    qp.set("page_size", String(pageSize));
    if (customers_page) qp.set("customers_page", customers_page);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") qp.delete(k);
      else qp.set(k, String(v));
    });
    return `/${locale}/admin/customers?${qp.toString()}`;
  };

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_PAGE_STACK}>
        <div>
          <p className={ADMIN_PAGE_KICKER}>{t("kicker")}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{t("title")}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {t("subtitle")}
          </p>
        </div>

        <form method="get" className="grid gap-3 rounded-[1.6rem] border border-slate-200 bg-white p-4 md:grid-cols-[1fr_180px_auto]">
          <Input name="q" defaultValue={search} placeholder={t("searchPlaceholder")} />
          <select
            name="customers_filter"
            defaultValue={filter}
            className="h-9 rounded-xl border border-input bg-white px-3 text-sm text-slate-700"
          >
            <option value="all">{t("filters.all")}</option>
            <option value="repeat">{t("filters.repeat")}</option>
            <option value="outstanding">{t("filters.outstanding")}</option>
            <option value="high_value">{t("filters.highValue")}</option>
            <option value="inactive">{t("filters.inactive")}</option>
          </select>
          <button className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white" type="submit">
            {t("actions.filter")}
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {["all", "repeat", "outstanding", "high_value", "inactive"].map((chip) => {
            const isActive = chip === filter;
            const key =
              chip === "high_value"
                ? "highValue"
                : chip;
            return (
              <Link
                key={chip}
                href={buildHref({ customers_filter: chip, customers_page: 1 })}
                className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-semibold transition-colors ${
                  isActive
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {t(`chips.${key}`)}
              </Link>
            );
          })}
        </div>

        <div className={ADMIN_PAGE_META_ROW}>
          <div className={ADMIN_PAGE_META_TEXT}>{t("meta.showing", { start: startRow, end: endRow, total })}</div>
          <div className={ADMIN_PAGE_ROWS_WRAP}>
            <span className={ADMIN_PAGE_META_TEXT}>{t("meta.rows")}</span>
            {ADMIN_PAGE_SIZE_OPTIONS.map((size) => (
              <Link
                key={size}
                className={`${ADMIN_PAGE_ROWS_BUTTON} ${pageSize === size ? ADMIN_PAGE_ROWS_BUTTON_ACTIVE : ADMIN_PAGE_ROWS_BUTTON_IDLE}`}
                href={buildHref({ page_size: size, customers_page: 1 })}
              >
                {size}
              </Link>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.6rem] bg-white shadow-[0_24px_56px_-32px_hsl(215_28%_17%/0.12)] ring-1 ring-[hsl(215_25%_27%/0.05)]">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50/80 text-left text-xs uppercase tracking-[0.12em] text-slate-600">
              <tr>
                <th className="px-4 py-3">{t("table.customer")}</th>
                <th className="px-4 py-3">{t("table.bookings")}</th>
                <th className="px-4 py-3">{t("table.revenue")}</th>
                <th className="px-4 py-3">{t("table.outstanding")}</th>
                <th className="px-4 py-3">{t("table.lastBooking")}</th>
                <th className="px-4 py-3">{t("table.action")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-500" colSpan={6}>{t("table.empty")}</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.customerKey} className="border-b last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{row.customerName || t("common.unknown")}</div>
                      <div className="text-xs text-slate-600">{row.customerEmail || row.customerPhone || "-"}</div>
                    </td>
                    <td className="px-4 py-3">{row.totalBookings}</td>
                    <td className="px-4 py-3">{formatMoney(Number(row.totalRevenueCents || 0))}</td>
                    <td className="px-4 py-3">{row.outstandingCount > 0 ? t("common.yes") : t("common.no")}</td>
                    <td className="px-4 py-3">{row.lastBookingAt ? new Date(row.lastBookingAt).toLocaleDateString("en-US") : "-"}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/${locale}/admin/customers/${encodeURIComponent(row.customerKey)}`}
                        className="font-semibold text-[hsl(var(--primary))] hover:underline"
                      >
                        {t("actions.open")}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={ADMIN_PAGE_PAGER}>
          {safePage > 1 ? (
            <Link className={ADMIN_PAGE_PAGER_BUTTON} href={buildHref({ customers_page: safePage - 1 })}>{t("actions.previous")}</Link>
          ) : (
            <span className={ADMIN_PAGE_PAGER_DISABLED}>{t("actions.previous")}</span>
          )}
          <span className={ADMIN_PAGE_PAGER_CURRENT}>{safePage}/{totalPages}</span>
          {safePage < totalPages ? (
            <Link className={ADMIN_PAGE_PAGER_BUTTON} href={buildHref({ customers_page: safePage + 1 })}>{t("actions.next")}</Link>
          ) : (
            <span className={ADMIN_PAGE_PAGER_DISABLED}>{t("actions.next")}</span>
          )}
        </div>
      </div>
    </div>
  );
}

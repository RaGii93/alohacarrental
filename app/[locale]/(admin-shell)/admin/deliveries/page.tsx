import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { BookingsTable } from "@/components/admin/BookingsTable";
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
import Link from "next/link";
import { DateRangeFilters } from "@/components/admin/DateRangeFilters";

const parseInputDate = (value?: string) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toInputDate = (value: Date) => {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default async function AdminDeliveriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ deliveries_page?: string; page_size?: string; start?: string; end?: string }>;
}) {
  const { locale } = await params;
  const { deliveries_page, page_size, start, end } = await searchParams;
  const t = await getTranslations();
  await requireAdminSection(locale, "deliveries");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const defaultEnd = new Date(today);
  defaultEnd.setDate(defaultEnd.getDate() + 7);
  const rangeStart = parseInputDate(start) ?? today;
  const rangeEnd = parseInputDate(end) ?? defaultEnd;
  const rangeEndExclusive = new Date(rangeEnd);
  rangeEndExclusive.setDate(rangeEndExclusive.getDate() + 1);
  const pageSize = toPageSize(page_size);
  const page = toPositiveInt(deliveries_page);
  const where = {
    status: "CONFIRMED" as const,
    startDate: { gte: rangeStart, lt: rangeEndExclusive },
  };
  const [total, rows] = await Promise.all([
    db.booking.count({ where }),
    db.booking.findMany({
      where,
      include: { vehicle: true, category: true, pickupLocationRef: true },
      orderBy: { startDate: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  const buildHref = (updates: Record<string, string | number | undefined>) => {
    const qp = new URLSearchParams();
    qp.set("page_size", String(pageSize));
    qp.set("start", toInputDate(rangeStart));
    qp.set("end", toInputDate(rangeEnd));
    if (deliveries_page) qp.set("deliveries_page", deliveries_page);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") qp.delete(k);
      else qp.set(k, String(v));
    });
    return `/${locale}/admin/deliveries?${qp.toString()}`;
  };
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const startRow = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endRow = Math.min(total, safePage * pageSize);
  const prevLabel = t("common.previous");
  const nextLabel = t("common.next");
  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_PAGE_STACK}>
        <p className={ADMIN_PAGE_KICKER}>{t("admin.dashboard.deliveries.title")}</p>
        <div className={ADMIN_PAGE_META_ROW}>
          <DateRangeFilters
            initialStart={toInputDate(rangeStart)}
            initialEnd={toInputDate(rangeEnd)}
            pageParam="deliveries_page"
          />
          <div className={ADMIN_PAGE_META_TEXT}>Showing {startRow}-{endRow} of {total}</div>
          <div className={ADMIN_PAGE_ROWS_WRAP}>
            <span className={ADMIN_PAGE_META_TEXT}>Rows:</span>
          {ADMIN_PAGE_SIZE_OPTIONS.map((size) => (
            <Link key={size} className={`${ADMIN_PAGE_ROWS_BUTTON} ${pageSize === size ? ADMIN_PAGE_ROWS_BUTTON_ACTIVE : ADMIN_PAGE_ROWS_BUTTON_IDLE}`} href={buildHref({ page_size: size, deliveries_page: 1 })}>
              {size}
            </Link>
          ))}
        </div>
        </div>
        <BookingsTable bookings={rows as any} locale={locale} status="CONFIRMED" dateMode="pickup" actionMode="deliveries" />
        <div className={ADMIN_PAGE_PAGER}>
        {safePage > 1 ? (
          <Link className={ADMIN_PAGE_PAGER_BUTTON} href={buildHref({ deliveries_page: safePage - 1 })}>
            {prevLabel}
          </Link>
        ) : (
          <span className={ADMIN_PAGE_PAGER_DISABLED}>{prevLabel}</span>
        )}
        <span className={ADMIN_PAGE_PAGER_CURRENT}>
          {safePage}/{totalPages}
        </span>
        {safePage < totalPages ? (
          <Link className={ADMIN_PAGE_PAGER_BUTTON} href={buildHref({ deliveries_page: safePage + 1 })}>
            {nextLabel}
          </Link>
        ) : (
          <span className={ADMIN_PAGE_PAGER_DISABLED}>{nextLabel}</span>
        )}
        </div>
      </div>
    </div>
  );
}

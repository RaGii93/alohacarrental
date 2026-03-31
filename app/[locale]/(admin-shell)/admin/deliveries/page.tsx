import Link from "next/link";
import { Prisma } from "@prisma/client";
import { Truck, CalendarDays, Clock3 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { ActivityFilters } from "@/components/admin/ActivityFilters";
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

const parseInputDate = (value?: string, endOfDay = false) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (endOfDay) parsed.setHours(23, 59, 59, 999);
  return parsed;
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
  searchParams: Promise<{ deliveries_page?: string; page_size?: string; start?: string; end?: string; q?: string }>;
}) {
  const { locale } = await params;
  const { deliveries_page, page_size, start, end, q } = await searchParams;
  const t = await getTranslations();
  await requireAdminSection(locale, "deliveries");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const defaultEnd = new Date(today);
  defaultEnd.setDate(defaultEnd.getDate() + 7);

  const rangeStart = parseInputDate(start) ?? today;
  const rangeEnd = parseInputDate(end, true) ?? new Date(defaultEnd.getFullYear(), defaultEnd.getMonth(), defaultEnd.getDate(), 23, 59, 59, 999);
  const searchTerm = (q || "").trim();
  const pageSize = toPageSize(page_size);
  const page = toPositiveInt(deliveries_page);

  const where: Prisma.BookingWhereInput = {
    status: "CONFIRMED",
    startDate: { gte: rangeStart, lte: rangeEnd },
    ...(searchTerm
      ? {
          OR: [
            { bookingCode: { contains: searchTerm, mode: "insensitive" } },
            { customerName: { contains: searchTerm, mode: "insensitive" } },
            { customerEmail: { contains: searchTerm, mode: "insensitive" } },
            { customerPhone: { contains: searchTerm, mode: "insensitive" } },
            { vehicle: { name: { contains: searchTerm, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, rows, todayCount] = await Promise.all([
    db.booking.count({ where }),
    db.booking.findMany({
      where,
      include: { vehicle: true, category: true, pickupLocationRef: true },
      orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.booking.count({
      where: {
        status: "CONFIRMED",
        startDate: {
          gte: today,
          lte: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999),
        },
      },
    }),
  ]);

  const buildHref = (updates: Record<string, string | number | undefined>) => {
    const qp = new URLSearchParams();
    qp.set("page_size", String(pageSize));
    if (q) qp.set("q", q);
    if (start) qp.set("start", start);
    if (end) qp.set("end", end);
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
  const pills = [
    searchTerm ? t("admin.activities.pills.search", { value: searchTerm }) : "",
    t("admin.activities.pills.from", { value: toInputDate(rangeStart) }),
    t("admin.activities.pills.to", { value: toInputDate(rangeEnd) }),
  ].filter(Boolean);

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_PAGE_STACK}>
        <div>
          <p className={ADMIN_PAGE_KICKER}>{t("admin.dashboard.tabs.deliveries")}</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">{t("admin.deliveries.title")}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            {t("admin.deliveries.description")}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: t("admin.deliveries.cards.visible"), value: total, icon: Truck, tone: "bg-sky-50 text-sky-700" },
            { label: t("admin.deliveries.cards.today"), value: todayCount, icon: Clock3, tone: "bg-amber-50 text-amber-700" },
            { label: t("admin.deliveries.cards.range"), value: t("admin.activities.range", { start: toInputDate(rangeStart), end: toInputDate(rangeEnd) }), icon: CalendarDays, tone: "bg-slate-100 text-slate-700" },
          ].map((item) => (
            <div key={item.label} className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-[0_24px_56px_-32px_hsl(215_28%_17%/0.12)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{item.value}</p>
                </div>
                <div className={`inline-flex size-12 items-center justify-center rounded-2xl ${item.tone}`}>
                  <item.icon className="size-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <ActivityFilters
          title={t("admin.deliveries.filters.title")}
          description={t("admin.deliveries.filters.description")}
          initialStart={toInputDate(rangeStart)}
          initialEnd={toInputDate(rangeEnd)}
          initialQuery={searchTerm}
          pageParam="deliveries_page"
        />

        <div className="rounded-[1.6rem] border border-[hsl(var(--border))] bg-[linear-gradient(180deg,#ffffff,hsl(var(--accent)/0.18))] p-4 shadow-[0_20px_48px_-30px_hsl(var(--primary)/0.14)]">
          <div className={ADMIN_PAGE_META_ROW}>
            <div className={ADMIN_PAGE_META_TEXT}>{t("admin.activities.showing", { start: startRow, end: endRow, total })}</div>
            <div className={ADMIN_PAGE_ROWS_WRAP}>
              {pills.map((pill) => (
                <span key={pill} className="rounded-full bg-[hsl(var(--accent)/0.45)] px-3 py-1 text-xs font-medium text-[hsl(var(--accent-foreground))]">
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={ADMIN_PAGE_META_ROW}>
          <div className={ADMIN_PAGE_META_TEXT}>{t("admin.activities.rowsPerPage")}</div>
          <div className={ADMIN_PAGE_ROWS_WRAP}>
            {ADMIN_PAGE_SIZE_OPTIONS.map((size) => (
              <Link
                key={size}
                className={`${ADMIN_PAGE_ROWS_BUTTON} ${pageSize === size ? ADMIN_PAGE_ROWS_BUTTON_ACTIVE : ADMIN_PAGE_ROWS_BUTTON_IDLE}`}
                href={buildHref({ page_size: size, deliveries_page: 1 })}
              >
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

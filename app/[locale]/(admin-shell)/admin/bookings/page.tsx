import Link from "next/link";
import { Prisma } from "@prisma/client";
import { Clock3, XCircle, CheckCircle2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { BookingsFilters } from "@/components/admin/BookingsFilters";
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

function parseDateInput(value: string | undefined, endOfDay: boolean) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (endOfDay) parsed.setHours(23, 59, 59, 999);
  return parsed;
}

function toInputDate(value: Date) {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default async function AdminBookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    bookings_status?: string;
    pending_page?: string;
    confirmed_page?: string;
    declined_page?: string;
    page_size?: string;
    q?: string;
    start?: string;
    end?: string;
  }>;
}) {
  const { locale } = await params;
  const { bookings_status, pending_page, confirmed_page, declined_page, page_size, q, start, end } = await searchParams;
  const t = await getTranslations();
  const auth = await requireAdminSection(locale, "bookings");
  const tOr = (key: string, values: Record<string, any>, fallback: string) =>
    t.has(key as any) ? t(key as any, values as any) : fallback;

  const activeStatus =
    bookings_status === "confirmed" || bookings_status === "declined" ? bookings_status : "pending";
  const pageSize = toPageSize(page_size);
  const page = activeStatus === "pending"
    ? toPositiveInt(pending_page)
    : activeStatus === "confirmed"
      ? toPositiveInt(confirmed_page)
      : toPositiveInt(declined_page);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = parseDateInput(start, false) || today;
  const endDate = parseDateInput(end, true);
  const searchTerm = (q || "").trim();

  const baseWhere: Prisma.BookingWhereInput = {
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
    startDate: {
      gte: startDate,
      ...(endDate ? { lte: endDate } : {}),
    },
  };

  const pendingWhere: Prisma.BookingWhereInput = { ...baseWhere, status: "PENDING" };
  const confirmedWhere: Prisma.BookingWhereInput = { ...baseWhere, status: "CONFIRMED" };
  const declinedWhere: Prisma.BookingWhereInput = { ...baseWhere, status: "DECLINED" };

  const [pendingTotal, confirmedTotal, declinedTotal] = await Promise.all([
    db.booking.count({ where: pendingWhere }),
    db.booking.count({ where: confirmedWhere }),
    db.booking.count({ where: declinedWhere }),
  ]);

  const total = activeStatus === "pending" ? pendingTotal : activeStatus === "confirmed" ? confirmedTotal : declinedTotal;
  const where = activeStatus === "pending" ? pendingWhere : activeStatus === "confirmed" ? confirmedWhere : declinedWhere;

  const rows = await db.booking.findMany({
    where,
    include: { vehicle: true, category: true },
    orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const buildHref = (updates: Record<string, string | number | undefined>) => {
    const qp = new URLSearchParams();
    qp.set("bookings_status", activeStatus);
    qp.set("page_size", String(pageSize));
    if (q) qp.set("q", q);
    if (start) qp.set("start", start);
    if (end) qp.set("end", end);
    if (pending_page) qp.set("pending_page", pending_page);
    if (confirmed_page) qp.set("confirmed_page", confirmed_page);
    if (declined_page) qp.set("declined_page", declined_page);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") qp.delete(k);
      else qp.set(k, String(v));
    });
    return `/${locale}/admin/bookings?${qp.toString()}`;
  };

  const buildStatusHref = (statusKey: "pending" | "confirmed" | "declined") => {
    const qp = new URLSearchParams();
    qp.set("bookings_status", statusKey);
    qp.set("page_size", String(pageSize));
    if (searchTerm) qp.set("q", searchTerm);
    if (start) qp.set("start", start);
    if (end) qp.set("end", end);
    return `/${locale}/admin/bookings?${qp.toString()}`;
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const startRow = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endRow = Math.min(total, safePage * pageSize);
  const pageParam = activeStatus === "pending" ? "pending_page" : activeStatus === "confirmed" ? "confirmed_page" : "declined_page";
  const statusLabel = activeStatus === "pending"
    ? t("admin.tabs.pending")
    : activeStatus === "confirmed"
      ? t("admin.tabs.confirmed")
      : t("admin.tabs.declined");
  const prevLabel = t("common.previous");
  const nextLabel = t("common.next");
  const activeFilterPills = [
    searchTerm ? t("admin.bookings.list.pills.search", { value: searchTerm }) : "",
    t("admin.bookings.list.pills.from", { value: toInputDate(startDate) }),
    endDate ? t("admin.bookings.list.pills.to", { value: toInputDate(endDate) }) : "",
  ].filter(Boolean);

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_PAGE_STACK}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className={ADMIN_PAGE_KICKER}>{t("admin.dashboard.tabs.bookings")}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">{t("admin.bookings.list.title")}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              {t("admin.bookings.list.description")}
            </p>
          </div>
          {(auth.admin.role === "ROOT" || auth.admin.role === "OWNER") && (
            <Link
              href={`/${locale}/admin/bookings/new`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              {tOr("admin.bookings.create", {}, "New booking")}
            </Link>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              key: "pending",
              label: t("admin.tabs.pending"),
              total: pendingTotal,
              icon: Clock3,
              tone: "bg-amber-50 text-amber-700",
            },
            {
              key: "confirmed",
              label: t("admin.tabs.confirmed"),
              total: confirmedTotal,
              icon: CheckCircle2,
              tone: "bg-emerald-50 text-emerald-700",
            },
            {
              key: "declined",
              label: t("admin.tabs.declined"),
              total: declinedTotal,
              icon: XCircle,
              tone: "bg-rose-50 text-rose-700",
            },
          ].map((item) => {
            const isActive = activeStatus === item.key;
            return (
              <Link
                key={item.key}
                href={buildStatusHref(item.key as "pending" | "confirmed" | "declined")}
              className={`rounded-[1.7rem] border p-5 shadow-[0_24px_56px_-32px_hsl(var(--primary)/0.14)] transition ${
                  isActive ? "border-[hsl(var(--primary))] bg-[linear-gradient(135deg,hsl(var(--foreground)),hsl(var(--primary)))] text-white" : "border-[hsl(var(--border))] bg-white hover:border-[hsl(var(--primary)/0.25)]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-sm ${isActive ? "text-slate-300" : "text-slate-500"}`}>{item.label}</p>
                    <p className="mt-2 text-3xl font-black tracking-tight">{item.total}</p>
                  </div>
                  <div className={`inline-flex size-12 items-center justify-center rounded-2xl ${isActive ? "bg-white/10 text-white" : item.tone}`}>
                    <item.icon className="size-5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <BookingsFilters
          initialStart={toInputDate(startDate)}
          initialEnd={endDate ? toInputDate(endDate) : ""}
          initialQuery={searchTerm}
        />

        <div className="rounded-[1.6rem] border border-[hsl(var(--border))] bg-[linear-gradient(180deg,#ffffff,hsl(var(--accent)/0.18))] p-4 shadow-[0_20px_48px_-30px_hsl(var(--primary)/0.14)]">
          <div className={ADMIN_PAGE_META_ROW}>
            <div className={ADMIN_PAGE_META_TEXT}>
              {t("admin.bookings.list.showingStatus", { status: statusLabel, start: startRow, end: endRow, total })}
            </div>
            <div className={ADMIN_PAGE_ROWS_WRAP}>
              {activeFilterPills.map((pill) => (
                <span key={pill} className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className={ADMIN_PAGE_META_ROW}>
          <div className={ADMIN_PAGE_META_TEXT}>{t("admin.bookings.list.rowsPerPage")}</div>
          <div className={ADMIN_PAGE_ROWS_WRAP}>
            {ADMIN_PAGE_SIZE_OPTIONS.map((size) => (
              <Link
                key={size}
                className={`${ADMIN_PAGE_ROWS_BUTTON} ${pageSize === size ? ADMIN_PAGE_ROWS_BUTTON_ACTIVE : ADMIN_PAGE_ROWS_BUTTON_IDLE}`}
                href={buildHref({ page_size: size, [pageParam]: 1 })}
              >
                {size}
              </Link>
            ))}
          </div>
        </div>

        <BookingsTable
          bookings={rows as any}
          locale={locale}
          status={activeStatus === "pending" ? "PENDING" : activeStatus === "confirmed" ? "CONFIRMED" : "DECLINED"}
        />

        <div className={ADMIN_PAGE_PAGER}>
          {safePage > 1 ? (
            <Link className={ADMIN_PAGE_PAGER_BUTTON} href={buildHref({ [pageParam]: safePage - 1 })}>
              {prevLabel}
            </Link>
          ) : (
            <span className={ADMIN_PAGE_PAGER_DISABLED}>{prevLabel}</span>
          )}
          <span className={ADMIN_PAGE_PAGER_CURRENT}>
            {safePage}/{totalPages}
          </span>
          {safePage < totalPages ? (
            <Link className={ADMIN_PAGE_PAGER_BUTTON} href={buildHref({ [pageParam]: safePage + 1 })}>
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

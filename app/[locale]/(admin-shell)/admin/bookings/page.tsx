import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { BookingsTable } from "@/components/admin/BookingsTable";
import {
  ADMIN_PAGE_SIZE_OPTIONS,
  requireAdminSection,
  toPageSize,
  toPositiveInt,
} from "@/app/[locale]/admin/_lib";

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
  }>;
}) {
  const { locale } = await params;
  const { bookings_status, pending_page, confirmed_page, declined_page, page_size } = await searchParams;
  const t = await getTranslations();
  const tOr = (key: string, values: Record<string, any>, fallback: string) =>
    t.has(key as any) ? t(key as any, values as any) : fallback;
  const auth = await requireAdminSection(locale, "bookings");
  const activeStatus =
    bookings_status === "confirmed" || bookings_status === "declined" ? bookings_status : "pending";
  const pageSize = toPageSize(page_size);
  const page = activeStatus === "pending"
    ? toPositiveInt(pending_page)
    : activeStatus === "confirmed"
      ? toPositiveInt(confirmed_page)
      : toPositiveInt(declined_page);

  const [pendingTotal, confirmedTotal, declinedTotal] = await Promise.all([
    db.booking.count({ where: { status: "PENDING" } }),
    db.booking.count({ where: { status: "CONFIRMED" } }),
    db.booking.count({ where: { status: "DECLINED" } }),
  ]);
  const total = activeStatus === "pending" ? pendingTotal : activeStatus === "confirmed" ? confirmedTotal : declinedTotal;
  const where = activeStatus === "pending" ? { status: "PENDING" as const } : activeStatus === "confirmed" ? { status: "CONFIRMED" as const } : { status: "DECLINED" as const };
  const rows = await db.booking.findMany({
    where,
    include: { vehicle: true, category: true },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const buildHref = (updates: Record<string, string | number | undefined>) => {
    const qp = new URLSearchParams();
    qp.set("bookings_status", activeStatus);
    qp.set("page_size", String(pageSize));
    if (pending_page) qp.set("pending_page", pending_page);
    if (confirmed_page) qp.set("confirmed_page", confirmed_page);
    if (declined_page) qp.set("declined_page", declined_page);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") qp.delete(k);
      else qp.set(k, String(v));
    });
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
  const statusTotal = activeStatus === "pending" ? pendingTotal : activeStatus === "confirmed" ? confirmedTotal : declinedTotal;
  const prevLabel = t("common.previous");
  const nextLabel = t("common.next");

  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-[hsl(var(--foreground)/0.78)]">
            {statusLabel}: {statusTotal}
          </p>
          {(auth.admin.role === "ROOT" || auth.admin.role === "OWNER") && (
            <Link
              href={`/${locale}/admin/bookings/new`}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[hsl(var(--primary))] px-4 text-sm font-semibold text-white transition-colors hover:bg-[hsl(var(--primary)/0.92)]"
            >
              {tOr("admin.bookings.create", {}, "New booking")}
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between">
          <div className="font-medium text-[hsl(var(--foreground)/0.72)]">Showing {startRow}-{endRow} of {total}</div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-[hsl(var(--foreground)/0.72)]">Rows:</span>
            {ADMIN_PAGE_SIZE_OPTIONS.map((size) => (
              <Link
                key={size}
                className={`inline-flex h-9 items-center rounded-xl border px-3 text-xs transition-colors ${
                  pageSize === size
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] font-semibold text-[hsl(var(--primary))]"
                    : "border-[hsl(var(--border))] bg-white text-[hsl(var(--foreground)/0.75)] hover:bg-[hsl(var(--secondary))]"
                }`}
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

        <div className="flex items-center justify-end gap-2">
          {safePage > 1 ? (
            <Link className="inline-flex h-9 items-center rounded-xl border border-[hsl(var(--border))] bg-white px-3 text-xs text-[hsl(var(--foreground)/0.78)] hover:bg-[hsl(var(--secondary))]" href={buildHref({ [pageParam]: safePage - 1 })}>
              {prevLabel}
            </Link>
          ) : (
            <span className="inline-flex h-9 items-center rounded-xl border border-[hsl(var(--border))] bg-white px-3 text-xs opacity-50">{prevLabel}</span>
          )}
          <span className="inline-flex h-9 items-center rounded-xl border border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] px-3 text-xs font-semibold text-[hsl(var(--primary))]">
            {safePage}/{totalPages}
          </span>
          {safePage < totalPages ? (
            <Link className="inline-flex h-9 items-center rounded-xl border border-[hsl(var(--border))] bg-white px-3 text-xs text-[hsl(var(--foreground)/0.78)] hover:bg-[hsl(var(--secondary))]" href={buildHref({ [pageParam]: safePage + 1 })}>
              {nextLabel}
            </Link>
          ) : (
            <span className="inline-flex h-9 items-center rounded-xl border border-[hsl(var(--border))] bg-white px-3 text-xs opacity-50">{nextLabel}</span>
          )}
        </div>
      </div>
    </div>
  );
}

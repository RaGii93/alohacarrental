import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { BookingsTable } from "@/components/admin/BookingsTable";
import { ADMIN_PAGE_SIZE_OPTIONS, requireLicensedAdmin, toPageSize, toPositiveInt } from "@/app/[locale]/admin/_lib";
import Link from "next/link";

export default async function AdminReturnsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ returns_page?: string; page_size?: string }>;
}) {
  const { locale } = await params;
  const { returns_page, page_size } = await searchParams;
  const t = await getTranslations();
  await requireLicensedAdmin(locale);
  const now = new Date();
  const sevenDays = new Date(now);
  sevenDays.setDate(sevenDays.getDate() + 7);
  const pageSize = toPageSize(page_size);
  const page = toPositiveInt(returns_page);
  const where = { status: "CONFIRMED" as const, endDate: { gte: now, lte: sevenDays } };
  const [total, rows] = await Promise.all([
    db.booking.count({ where }),
    db.booking.findMany({
      where,
      include: { vehicle: true, category: true, dropoffLocationRef: true },
      orderBy: { endDate: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  const buildHref = (updates: Record<string, string | number | undefined>) => {
    const qp = new URLSearchParams();
    qp.set("page_size", String(pageSize));
    if (returns_page) qp.set("returns_page", returns_page);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") qp.delete(k);
      else qp.set(k, String(v));
    });
    return `/${locale}/admin/returns?${qp.toString()}`;
  };
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const startRow = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endRow = Math.min(total, safePage * pageSize);
  const prevLabel = t("common.previous");
  const nextLabel = t("common.next");
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="mb-4 text-xl font-semibold">{t("admin.dashboard.returns.title")}</h2>
      <div className="mb-3 flex flex-col gap-2 text-sm md:flex-row md:items-center md:justify-between">
        <div className="text-muted-foreground">Showing {startRow}-{endRow} of {total}</div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Rows:</span>
          {ADMIN_PAGE_SIZE_OPTIONS.map((size) => (
            <Link key={size} className={`inline-flex h-8 items-center rounded-md border px-2 text-xs ${pageSize === size ? "bg-accent font-medium" : "hover:bg-accent"}`} href={buildHref({ page_size: size, returns_page: 1 })}>
              {size}
            </Link>
          ))}
        </div>
      </div>
      <BookingsTable bookings={rows as any} locale={locale} status="CONFIRMED" dateMode="dropoff" actionMode="returns" />
      <div className="mt-4 flex items-center justify-end gap-2">
        {safePage > 1 ? (
          <Link className="inline-flex h-8 items-center rounded-md border px-3 text-xs hover:bg-accent" href={buildHref({ returns_page: safePage - 1 })}>
            {prevLabel}
          </Link>
        ) : (
          <span className="inline-flex h-8 items-center rounded-md border px-3 text-xs opacity-50">{prevLabel}</span>
        )}
        <span className="inline-flex h-8 items-center rounded-md border px-2 text-xs">
          {safePage}/{totalPages}
        </span>
        {safePage < totalPages ? (
          <Link className="inline-flex h-8 items-center rounded-md border px-3 text-xs hover:bg-accent" href={buildHref({ returns_page: safePage + 1 })}>
            {nextLabel}
          </Link>
        ) : (
          <span className="inline-flex h-8 items-center rounded-md border px-3 text-xs opacity-50">{nextLabel}</span>
        )}
      </div>
    </div>
  );
}

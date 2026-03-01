import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import {
  ADMIN_PAGE_SIZE_OPTIONS,
  requireAdminSection,
  toPageSize,
  toPositiveInt,
} from "@/app/[locale]/admin/_lib";
import { LocationsTable } from "@/components/admin/LocationsTable";

export default async function AdminLocationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ locations_page?: string; page_size?: string }>;
}) {
  const { locale } = await params;
  const { locations_page, page_size } = await searchParams;
  const t = await getTranslations();
  const tOr = (key: string, fallback: string) => (t.has(key as any) ? t(key as any) : fallback);

  await requireAdminSection(locale, "locations");

  const pageSize = toPageSize(page_size);
  const page = toPositiveInt(locations_page);

  const [total, rows] = await Promise.all([
    db.location.count(),
    db.location.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: {
            pickupBookings: true,
            dropoffBookings: true,
          },
        },
      },
    }),
  ]);

  const buildHref = (updates: Record<string, string | number | undefined>) => {
    const qp = new URLSearchParams();
    qp.set("page_size", String(pageSize));
    if (locations_page) qp.set("locations_page", locations_page);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") qp.delete(k);
      else qp.set(k, String(v));
    });
    return `/${locale}/admin/locations?${qp.toString()}`;
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const startRow = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endRow = Math.min(total, safePage * pageSize);
  const prevLabel = t("common.previous");
  const nextLabel = t("common.next");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="mb-4 text-xl font-semibold">{tOr("admin.locations.title", "Locations")}</h2>

      <div className="mb-3 flex flex-col gap-2 text-sm md:flex-row md:items-center md:justify-between">
        <div className="text-muted-foreground">Showing {startRow}-{endRow} of {total}</div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Rows:</span>
          {ADMIN_PAGE_SIZE_OPTIONS.map((size) => (
            <Link
              key={size}
              className={`inline-flex h-8 items-center rounded-md border px-2 text-xs ${pageSize === size ? "bg-accent font-medium" : "hover:bg-accent"}`}
              href={buildHref({ page_size: size, locations_page: 1 })}
            >
              {size}
            </Link>
          ))}
        </div>
      </div>

      <LocationsTable locations={rows as any} locale={locale} />

      <div className="mt-4 flex items-center justify-end gap-2">
        {safePage > 1 ? (
          <Link className="inline-flex h-8 items-center rounded-md border px-3 text-xs hover:bg-accent" href={buildHref({ locations_page: safePage - 1 })}>
            {prevLabel}
          </Link>
        ) : (
          <span className="inline-flex h-8 items-center rounded-md border px-3 text-xs opacity-50">{prevLabel}</span>
        )}
        <span className="inline-flex h-8 items-center rounded-md border px-2 text-xs">
          {safePage}/{totalPages}
        </span>
        {safePage < totalPages ? (
          <Link className="inline-flex h-8 items-center rounded-md border px-3 text-xs hover:bg-accent" href={buildHref({ locations_page: safePage + 1 })}>
            {nextLabel}
          </Link>
        ) : (
          <span className="inline-flex h-8 items-center rounded-md border px-3 text-xs opacity-50">{nextLabel}</span>
        )}
      </div>
    </div>
  );
}

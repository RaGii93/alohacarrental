import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { VehiclesTable } from "@/components/admin/VehiclesTable";
import { CategoriesTable } from "@/components/admin/CategoriesTable";
import { ExtrasTable } from "@/components/admin/ExtrasTable";
import { DiscountCodesTable } from "@/components/admin/DiscountCodesTable";
import { getBlobProxyUrl } from "@/lib/blob";
import { ADMIN_PAGE_SIZE_OPTIONS, requireAdminSection, toPageSize, toPositiveInt } from "@/app/[locale]/admin/_lib";

export default async function VehiclesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    vehicles_subtab?: string;
    vehicles_page?: string;
    categories_page?: string;
    extras_page?: string;
    discounts_page?: string;
    page_size?: string;
  }>;
}) {
  const { locale } = await params;
  const { vehicles_subtab, vehicles_page, categories_page, extras_page, discounts_page, page_size } = await searchParams;
  const t = await getTranslations();
  await requireAdminSection(locale, "vehicles");
  const activeSubtab = vehicles_subtab && ["manage", "pricing", "categories", "extras", "discounts"].includes(vehicles_subtab) ? vehicles_subtab : "manage";
  const pageSize = toPageSize(page_size);
  const vehiclesPage = toPositiveInt(vehicles_page);
  const categoriesPage = toPositiveInt(categories_page);
  const extrasPage = toPositiveInt(extras_page);
  const discountsPage = toPositiveInt(discounts_page);

  const categories = await db.vehicleCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  const vehicleCategories = categories.map((category) => ({ id: category.id, name: category.name }));

  const [vehiclesTotal, vehicleRows] = await Promise.all([
    db.vehicle.count(),
    db.vehicle.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
      skip: (vehiclesPage - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  const transformedVehicles = vehicleRows.map((vehicle) => ({
    ...vehicle,
    plateNumber: vehicle.plateNumber ?? undefined,
    category: vehicle.category?.name ?? undefined,
    notes: vehicle.notes ?? undefined,
  }));
  const [categoriesTotal, allCategoryRows] = await Promise.all([
    db.vehicleCategory.count(),
    db.vehicleCategory.findMany({
      include: { _count: { select: { vehicles: true, bookings: true } } },
      orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }],
      skip: (categoriesPage - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  let extrasTotal = 0;
  let extras: Array<any> = [];
  if ((db as any).extra && typeof (db as any).extra.findMany === "function") {
    const [total, rows] = await Promise.all([
      (db as any).extra.count(),
      (db as any).extra.findMany({
        orderBy: { createdAt: "desc" },
        skip: (extrasPage - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    extrasTotal = total;
    extras = rows;
  }

  let discountCodesTotal = 0;
  let discountCodes: Array<any> = [];
  if ((db as any).discountCode && typeof (db as any).discountCode.findMany === "function") {
    const [total, rows] = await Promise.all([
      (db as any).discountCode.count(),
      (db as any).discountCode.findMany({
        orderBy: { createdAt: "desc" },
        skip: (discountsPage - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    discountCodesTotal = total;
    discountCodes = rows;
  }

  const currency = (amountCents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amountCents / 100);
  const subtabLabel = activeSubtab === "manage"
    ? t("admin.dashboard.vehicles.manage")
    : activeSubtab === "pricing"
      ? t("admin.dashboard.vehicles.pricing")
      : activeSubtab === "categories"
        ? "Categories"
        : activeSubtab === "extras"
          ? "Extras"
          : "Discounts";
  const prevLabel = t("common.previous");
  const nextLabel = t("common.next");

  const buildPaginationHref = (subtab: string, updates: Record<string, string | number | undefined>) => {
    const qp = new URLSearchParams();
    qp.set("vehicles_subtab", subtab);
    qp.set("page_size", String(pageSize));
    if (vehicles_page) qp.set("vehicles_page", vehicles_page);
    if (categories_page) qp.set("categories_page", categories_page);
    if (extras_page) qp.set("extras_page", extras_page);
    if (discounts_page) qp.set("discounts_page", discounts_page);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") qp.delete(k);
      else qp.set(k, String(v));
    });
    return `/${locale}/admin/vehicles?${qp.toString()}`;
  };

  const renderPagination = (page: number, total: number, pageParam: string, subtab: string) => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const startRow = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const endRow = Math.min(total, safePage * pageSize);
    return (
      <div className="mb-3 flex flex-col gap-2 text-sm md:flex-row md:items-center md:justify-between">
        <div className="text-muted-foreground">Showing {startRow}-{endRow} of {total}</div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Rows:</span>
          {ADMIN_PAGE_SIZE_OPTIONS.map((size) => (
            <Link key={size} className={`inline-flex h-8 items-center rounded-md border px-2 text-xs ${pageSize === size ? "bg-accent font-medium" : "hover:bg-accent"}`} href={buildPaginationHref(subtab, { page_size: size, [pageParam]: 1 })}>
              {size}
            </Link>
          ))}
        </div>
      </div>
    );
  };

  const renderPager = (page: number, total: number, pageParam: string, subtab: string) => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    return (
      <div className="mt-4 flex items-center justify-end gap-2">
        {safePage > 1 ? (
          <Link className="inline-flex h-8 items-center rounded-md border px-3 text-xs hover:bg-accent" href={buildPaginationHref(subtab, { [pageParam]: safePage - 1 })}>
            {prevLabel}
          </Link>
        ) : (
          <span className="inline-flex h-8 items-center rounded-md border px-3 text-xs opacity-50">{prevLabel}</span>
        )}
        <span className="inline-flex h-8 items-center rounded-md border px-2 text-xs">
          {safePage}/{totalPages}
        </span>
        {safePage < totalPages ? (
          <Link className="inline-flex h-8 items-center rounded-md border px-3 text-xs hover:bg-accent" href={buildPaginationHref(subtab, { [pageParam]: safePage + 1 })}>
            {nextLabel}
          </Link>
        ) : (
          <span className="inline-flex h-8 items-center rounded-md border px-3 text-xs opacity-50">{nextLabel}</span>
        )}
      </div>
    );
  };

  return (
    <div className="w-full px-4 py-12 sm:px-6 lg:px-8">
      <p className="mb-4 text-sm text-muted-foreground">{subtabLabel}</p>

      {activeSubtab === "manage" && (
        <>
          {renderPagination(vehiclesPage, vehiclesTotal, "vehicles_page", "manage")}
          <VehiclesTable vehicles={transformedVehicles} categories={vehicleCategories} locale={locale} />
          {renderPager(vehiclesPage, vehiclesTotal, "vehicles_page", "manage")}
        </>
      )}

      {activeSubtab === "pricing" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id} className="p-4">
              {category.imageUrl ? (
                <img
                  src={category.imageUrl.startsWith("/") ? category.imageUrl : getBlobProxyUrl(category.imageUrl) || category.imageUrl}
                  alt={category.name}
                  className="mb-3 h-32 w-full rounded-md border object-cover"
                />
              ) : null}
              <p className="font-semibold">{category.name}</p>
              <p className="text-sm text-muted-foreground">{category.description || "-"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {category.seats} seats • {category.transmission === "MANUAL" ? "Manual" : "Automatic"} • {category.hasAC ? "A/C" : "No A/C"}
              </p>
              <p className="mt-2 text-lg font-bold">{currency(category.dailyRate)}</p>
            </Card>
          ))}
        </div>
      )}

      {activeSubtab === "categories" && (
        <>
          {renderPagination(categoriesPage, categoriesTotal, "categories_page", "categories")}
          <CategoriesTable categories={allCategoryRows as any} locale={locale} />
          {renderPager(categoriesPage, categoriesTotal, "categories_page", "categories")}
        </>
      )}

      {activeSubtab === "extras" && (
        <>
          {renderPagination(extrasPage, extrasTotal, "extras_page", "extras")}
          <ExtrasTable extras={extras as any} locale={locale} />
          {renderPager(extrasPage, extrasTotal, "extras_page", "extras")}
        </>
      )}

      {activeSubtab === "discounts" && (
        <>
          {renderPagination(discountsPage, discountCodesTotal, "discounts_page", "discounts")}
          <DiscountCodesTable discountCodes={discountCodes as any} locale={locale} />
          {renderPager(discountsPage, discountCodesTotal, "discounts_page", "discounts")}
        </>
      )}
    </div>
  );
}

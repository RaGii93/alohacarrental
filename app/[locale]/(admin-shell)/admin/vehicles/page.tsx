import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VehiclesTable } from "@/components/admin/VehiclesTable";
import { CategoriesTable } from "@/components/admin/CategoriesTable";
import { ExtrasTable } from "@/components/admin/ExtrasTable";
import { DiscountCodesTable } from "@/components/admin/DiscountCodesTable";
import { VehicleFeaturesTable } from "@/components/admin/VehicleFeaturesTable";
import { getBlobProxyUrl } from "@/lib/blob";
import { getCategoryFeatureNames } from "@/lib/vehicle-features";
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

export default async function VehiclesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    vehicles_subtab?: string;
    vehicles_page?: string;
    categories_page?: string;
    features_page?: string;
    extras_page?: string;
    discounts_page?: string;
    page_size?: string;
  }>;
}) {
  const { locale } = await params;
  const { vehicles_subtab, vehicles_page, categories_page, features_page, extras_page, discounts_page, page_size } = await searchParams;
  const t = await getTranslations();
  await requireAdminSection(locale, "vehicles");
  const activeSubtab = vehicles_subtab && ["manage", "pricing", "categories", "features", "extras", "discounts"].includes(vehicles_subtab) ? vehicles_subtab : "manage";
  const pageSize = toPageSize(page_size);
  const vehiclesPage = toPositiveInt(vehicles_page);
  const categoriesPage = toPositiveInt(categories_page);
  const featuresPage = toPositiveInt(features_page);
  const extrasPage = toPositiveInt(extras_page);
  const discountsPage = toPositiveInt(discounts_page);

  const [categories, featureCatalog] = await Promise.all([
    db.vehicleCategory.findMany({
      where: { isActive: true },
      include: { features: { include: { feature: true }, orderBy: { feature: { sortOrder: "asc" } } } },
      orderBy: { sortOrder: "asc" },
    }),
    db.vehicleFeature.findMany({
      include: { _count: { select: { categories: true } } },
      orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);
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
      include: {
        _count: { select: { vehicles: true, bookings: true } },
        features: { include: { feature: true }, orderBy: { feature: { sortOrder: "asc" } } },
      },
      orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }],
      skip: (categoriesPage - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const [featuresTotal, featureRows] = await Promise.all([
    db.vehicleFeature.count(),
    db.vehicleFeature.findMany({
      include: { _count: { select: { categories: true } } },
      orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
      skip: (featuresPage - 1) * pageSize,
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
        ? t("admin.categories.title")
        : activeSubtab === "features"
          ? t("admin.features.title")
        : activeSubtab === "extras"
          ? t("admin.extras.title")
          : t("admin.discounts.title");
  const prevLabel = t("common.previous");
  const nextLabel = t("common.next");
  const subtabs = [
    { key: "manage", label: t("admin.dashboard.vehicles.manage"), count: vehiclesTotal },
    { key: "pricing", label: t("admin.dashboard.vehicles.pricing"), count: categories.length },
    { key: "categories", label: t("admin.categories.title"), count: categoriesTotal },
    { key: "features", label: t("admin.features.title"), count: featuresTotal },
    { key: "extras", label: t("admin.extras.title"), count: extrasTotal },
    { key: "discounts", label: t("admin.discounts.title"), count: discountCodesTotal },
  ] as const;

  const buildPaginationHref = (subtab: string, updates: Record<string, string | number | undefined>) => {
    const qp = new URLSearchParams();
    qp.set("vehicles_subtab", subtab);
    qp.set("page_size", String(pageSize));
    if (vehicles_page) qp.set("vehicles_page", vehicles_page);
    if (categories_page) qp.set("categories_page", categories_page);
    if (features_page) qp.set("features_page", features_page);
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
      <div className={ADMIN_PAGE_META_ROW}>
        <div className={ADMIN_PAGE_META_TEXT}>{t("admin.shared.showing", { start: startRow, end: endRow, total })}</div>
        <div className={ADMIN_PAGE_ROWS_WRAP}>
          <span className={ADMIN_PAGE_META_TEXT}>{t("admin.shared.rows")}</span>
          {ADMIN_PAGE_SIZE_OPTIONS.map((size) => (
            <Link
              key={size}
              className={`${ADMIN_PAGE_ROWS_BUTTON} ${pageSize === size ? ADMIN_PAGE_ROWS_BUTTON_ACTIVE : ADMIN_PAGE_ROWS_BUTTON_IDLE}`}
              href={buildPaginationHref(subtab, { page_size: size, [pageParam]: 1 })}
            >
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
      <div className={ADMIN_PAGE_PAGER}>
        {safePage > 1 ? (
          <Link className={ADMIN_PAGE_PAGER_BUTTON} href={buildPaginationHref(subtab, { [pageParam]: safePage - 1 })}>
            {prevLabel}
          </Link>
        ) : (
          <span className={ADMIN_PAGE_PAGER_DISABLED}>{prevLabel}</span>
        )}
        <span className={ADMIN_PAGE_PAGER_CURRENT}>
          {safePage}/{totalPages}
        </span>
        {safePage < totalPages ? (
          <Link className={ADMIN_PAGE_PAGER_BUTTON} href={buildPaginationHref(subtab, { [pageParam]: safePage + 1 })}>
            {nextLabel}
          </Link>
        ) : (
          <span className={ADMIN_PAGE_PAGER_DISABLED}>{nextLabel}</span>
        )}
      </div>
    );
  };

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_PAGE_STACK}>
      <div className="space-y-4">
        <p className={ADMIN_PAGE_KICKER}>{subtabLabel}</p>
        <div className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f7faff)] p-4 shadow-[0_26px_56px_-36px_rgba(15,23,42,0.18)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">{t("admin.dashboard.tabs.vehicles")}</h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-600">{t("admin.features.pageHint")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {subtabs.map((tab) => {
                const isActive = activeSubtab === tab.key;
                return (
                  <Link
                    key={tab.key}
                    href={buildPaginationHref(tab.key, {})}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "border-sky-300 bg-sky-50 text-sky-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <Badge className={isActive ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-700"}>{tab.count}</Badge>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        {activeSubtab === "features" ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="rounded-[1.5rem] border-slate-200 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("admin.features.title")}</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{featuresTotal}</p>
              <p className="mt-2 text-sm text-slate-600">{t("admin.features.createHint")}</p>
            </Card>
            <Card className="rounded-[1.5rem] border-slate-200 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("admin.categories.title")}</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{categoriesTotal}</p>
              <p className="mt-2 text-sm text-slate-600">{t("admin.features.assignHint")}</p>
            </Card>
            <Card className="rounded-[1.5rem] border-slate-200 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("admin.dashboard.vehicles.pricing")}</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{featureCatalog.filter((feature) => feature.isActive).length}</p>
              <p className="mt-2 text-sm text-slate-600">{t("admin.features.liveHint")}</p>
            </Card>
          </div>
        ) : null}
      </div>

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
                {t("admin.categories.pricingCard.features", {
                  seats: category.seats,
                  transmission: category.transmission === "MANUAL" ? t("admin.categories.manual") : t("admin.categories.automatic"),
                  features: getCategoryFeatureNames(category).join(" • ") || t("admin.categories.table.noFeatures"),
                })}
              </p>
              <p className="mt-2 text-lg font-bold">{currency(category.dailyRate)}</p>
              <p className="text-xs text-muted-foreground">{t("admin.categories.pricingCard.fuelRefill", { amount: currency(category.fuelChargePerQuarter ?? 2500) })}</p>
            </Card>
          ))}
        </div>
      )}

      {activeSubtab === "categories" && (
        <>
          {renderPagination(categoriesPage, categoriesTotal, "categories_page", "categories")}
          <CategoriesTable categories={allCategoryRows as any} availableFeatures={featureCatalog} locale={locale} />
          {renderPager(categoriesPage, categoriesTotal, "categories_page", "categories")}
        </>
      )}

      {activeSubtab === "features" && (
        <>
          {renderPagination(featuresPage, featuresTotal, "features_page", "features")}
          <VehicleFeaturesTable features={featureRows as any} />
          {renderPager(featuresPage, featuresTotal, "features_page", "features")}
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
    </div>
  );
}

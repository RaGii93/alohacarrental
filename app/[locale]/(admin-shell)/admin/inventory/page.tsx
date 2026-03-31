import { getTranslations } from "next-intl/server";
import { InventoryTransactionType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ADMIN_PAGE_KICKER, ADMIN_PAGE_SHELL, ADMIN_PAGE_STACK, requireAdminSection } from "@/app/[locale]/admin/_lib";
import { FleetOpsFilters } from "@/components/admin/FleetOpsFilters";
import { InventoryOverviewClient } from "@/components/admin/InventoryOverviewClient";
import { Button } from "@/components/ui/button";
import { getFleetOperationsSettings } from "@/lib/settings";

const TRANSACTION_TYPE_OPTIONS: Array<{ value: InventoryTransactionType; label: string }> = [
  { value: "PURCHASE", label: "admin.inventory.transactionTypes.purchase" },
  { value: "RETURN", label: "admin.inventory.transactionTypes.return" },
  { value: "ADJUSTMENT", label: "admin.inventory.transactionTypes.adjustment" },
  { value: "USAGE", label: "admin.inventory.transactionTypes.usage" },
];

const STOCK_FILTERS = new Set(["LOW_STOCK", "OUT_OF_STOCK", "IN_STOCK"]);

const parseDateBoundary = (value: string | undefined, boundary: "start" | "end") => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const suffix = boundary === "start" ? "T00:00:00.000Z" : "T23:59:59.999Z";
  const parsed = new Date(`${value}${suffix}`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export default async function AdminInventoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    stock?: string;
    category?: string;
    movement?: string;
    tire?: string;
    start?: string;
    end?: string;
  }>;
}) {
  const { locale } = await params;
  const { q, stock, category, movement, tire, start, end } = await searchParams;
  const t = await getTranslations();
  await requireAdminSection(locale, "inventory");

  const searchTerm = q?.trim() || "";
  const selectedStock = STOCK_FILTERS.has(stock || "") ? stock! : "";
  const selectedCategory = category?.trim() || "";
  const selectedMovement: InventoryTransactionType | "" = TRANSACTION_TYPE_OPTIONS.some((option) => option.value === movement)
    ? (movement as InventoryTransactionType)
    : "";
  const tireOnly = tire === "ONLY";
  const startDate = parseDateBoundary(start, "start");
  const endDate = parseDateBoundary(end, "end");

  const partWhere: Prisma.InventoryPartWhereInput = {
    isActive: true,
    ...(selectedCategory ? { category: selectedCategory } : {}),
    ...(tireOnly ? { isTireRelated: true } : {}),
    ...(searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { sku: { contains: searchTerm, mode: "insensitive" } },
            { category: { contains: searchTerm, mode: "insensitive" } },
            { brand: { contains: searchTerm, mode: "insensitive" } },
            { defaultSupplierName: { contains: searchTerm, mode: "insensitive" } },
            { tireBrandModel: { contains: searchTerm, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const transactionWhere: Prisma.InventoryTransactionWhereInput = {
    ...(selectedMovement ? { type: selectedMovement } : {}),
    ...((startDate || endDate)
      ? {
          transactionDate: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          },
        }
      : {}),
    ...(searchTerm
      ? {
          OR: [
            { notes: { contains: searchTerm, mode: "insensitive" } },
            { inventoryPart: { name: { contains: searchTerm, mode: "insensitive" } } },
            { inventoryPart: { sku: { contains: searchTerm, mode: "insensitive" } } },
            { inventoryPart: { defaultSupplierName: { contains: searchTerm, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(selectedCategory || tireOnly
      ? {
          inventoryPart: {
            ...(selectedCategory ? { category: selectedCategory } : {}),
            ...(tireOnly ? { isTireRelated: true } : {}),
          },
        }
      : {}),
  };

  const [settings, rawParts, transactions, categoryRows] = await Promise.all([
    getFleetOperationsSettings(),
    db.inventoryPart.findMany({
      where: partWhere,
      orderBy: [{ quantityInStock: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        brand: true,
        unit: true,
        quantityInStock: true,
        reorderThreshold: true,
        averageUnitCost: true,
        defaultSupplierName: true,
        isTireRelated: true,
      },
    }),
    db.inventoryTransaction.findMany({
      where: transactionWhere,
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
      take: 50,
      select: {
        id: true,
        type: true,
        quantity: true,
        unitCost: true,
        totalCost: true,
        transactionDate: true,
        notes: true,
        inventoryPart: {
          select: {
            name: true,
          },
        },
      },
    }),
    db.inventoryPart.findMany({
      where: { isActive: true, category: { not: null } },
      distinct: ["category"],
      orderBy: { category: "asc" },
      select: { category: true },
    }),
  ]);

  const parts = rawParts.filter((part) => {
    const threshold = part.reorderThreshold ?? settings.defaultLowStockThreshold;
    if (selectedStock === "OUT_OF_STOCK") return part.quantityInStock <= 0;
    if (selectedStock === "LOW_STOCK") return part.quantityInStock <= threshold;
    if (selectedStock === "IN_STOCK") return part.quantityInStock > 0;
    return true;
  });

  const lowStockParts = parts.filter((part) => part.quantityInStock <= (part.reorderThreshold ?? settings.defaultLowStockThreshold)).length;
  const stockUnits = Math.round(parts.reduce((sum, part) => sum + part.quantityInStock, 0));
  const stockValue = parts.reduce((sum, part) => sum + ((part.averageUnitCost ?? 0) * part.quantityInStock), 0);
  const categories = categoryRows.map((row) => row.category).filter((value): value is string => Boolean(value));
  const exportParams = new URLSearchParams();
  if (searchTerm) exportParams.set("q", searchTerm);
  if (selectedStock) exportParams.set("stock", selectedStock);
  if (selectedCategory) exportParams.set("category", selectedCategory);
  if (selectedMovement) exportParams.set("movement", selectedMovement);
  if (tireOnly) exportParams.set("tire", "ONLY");
  if (start) exportParams.set("start", start);
  if (end) exportParams.set("end", end);

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_PAGE_STACK}>
        <div>
          <p className={ADMIN_PAGE_KICKER}>{t.has("admin.dashboard.tabs.inventory" as any) ? t("admin.dashboard.tabs.inventory" as any) : "Inventory"}</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">{t("admin.inventory.page.title")}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            {t("admin.inventory.page.description")}
          </p>
        </div>

        <FleetOpsFilters
          title={t("admin.inventory.filters.title")}
          description={t("admin.inventory.filters.description")}
          audiences={[
            t("admin.inventory.audiences.financialClerk"),
            t("admin.inventory.audiences.mechanic"),
            t("admin.inventory.audiences.administration"),
            t("admin.inventory.audiences.rentalAgent"),
          ]}
          resultSummary={t("admin.inventory.filters.resultSummary", { parts: parts.length, movements: transactions.length })}
          search={{
            initialValue: searchTerm,
            placeholder: t("admin.inventory.filters.searchPlaceholder"),
          }}
          selects={[
            {
              param: "stock",
              label: t("admin.inventory.filters.stockStatus"),
              placeholder: t("admin.inventory.filters.allStockStatuses"),
              allLabel: t("admin.inventory.filters.allStockStatuses"),
              options: [
                { value: "LOW_STOCK", label: t("admin.inventory.filters.lowStock") },
                { value: "OUT_OF_STOCK", label: t("admin.inventory.filters.outOfStock") },
                { value: "IN_STOCK", label: t("admin.inventory.filters.inStock") },
              ],
            },
            {
              param: "category",
              label: t("admin.inventory.form.category"),
              placeholder: t("admin.inventory.filters.allCategories"),
              allLabel: t("admin.inventory.filters.allCategories"),
              options: categories.map((value) => ({ value, label: value })),
            },
            {
              param: "movement",
              label: t("admin.inventory.filters.movementType"),
              placeholder: t("admin.inventory.filters.allMovements"),
              allLabel: t("admin.inventory.filters.allMovements"),
              options: TRANSACTION_TYPE_OPTIONS.map((option) => ({ value: option.value, label: t(option.label as any) })),
            },
            {
              param: "tire",
              label: t("admin.inventory.filters.tireStock"),
              placeholder: t("admin.inventory.filters.allParts"),
              options: [{ value: "ONLY", label: t("admin.inventory.filters.tireOnly") }],
              allLabel: t("admin.inventory.filters.allParts"),
            },
          ]}
          dateRange={{
            initialStart: start,
            initialEnd: end,
          }}
        />

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-xl">
            <a href={`/api/admin/inventory/export?${new URLSearchParams([...exportParams.entries(), ["scope", "parts"]]).toString()}`}>
              {t("admin.inventory.actions.exportParts")}
            </a>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <a href={`/api/admin/inventory/export?${new URLSearchParams([...exportParams.entries(), ["scope", "movements"]]).toString()}`}>
              {t("admin.inventory.actions.exportMovements")}
            </a>
          </Button>
        </div>

        <InventoryOverviewClient
          locale={locale}
          summary={{
            activeParts: parts.length,
            lowStockParts,
            stockUnits,
            stockValue,
          }}
          parts={parts}
          transactions={transactions.map((transaction) => ({
            id: transaction.id,
            type: transaction.type,
            quantity: transaction.quantity,
            unitCost: transaction.unitCost,
            totalCost: transaction.totalCost,
            transactionDate: transaction.transactionDate.toISOString(),
            notes: transaction.notes,
            inventoryPartName: transaction.inventoryPart.name,
          }))}
        />
      </div>
    </div>
  );
}

import { InventoryTransactionType, Prisma } from "@prisma/client";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { getFleetOperationsSettings } from "@/lib/settings";

const TRANSACTION_TYPE_OPTIONS = new Set<InventoryTransactionType>([
  "PURCHASE",
  "RETURN",
  "ADJUSTMENT",
  "USAGE",
]);

const STOCK_FILTERS = new Set(["LOW_STOCK", "OUT_OF_STOCK", "IN_STOCK"]);

const parseDateBoundary = (value: string | null, boundary: "start" | "end") => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const suffix = boundary === "start" ? "T00:00:00.000Z" : "T23:59:59.999Z";
  const parsed = new Date(`${value}${suffix}`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const escapeCsv = (value: unknown) => {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, "\"\"")}"`;
  return text;
};

const toCsv = (rows: Array<Record<string, unknown>>) => {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")),
  ].join("\n");
};

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "ROOT" && session.role !== "OWNER")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") || "parts";
  const searchTerm = (searchParams.get("q") || "").trim();
  const selectedStock = STOCK_FILTERS.has(searchParams.get("stock") || "") ? searchParams.get("stock")! : "";
  const selectedCategory = (searchParams.get("category") || "").trim();
  const selectedMovement = TRANSACTION_TYPE_OPTIONS.has((searchParams.get("movement") || "") as InventoryTransactionType)
    ? (searchParams.get("movement") as InventoryTransactionType)
    : undefined;
  const tireOnly = searchParams.get("tire") === "ONLY";
  const startDate = parseDateBoundary(searchParams.get("start"), "start");
  const endDate = parseDateBoundary(searchParams.get("end"), "end");

  if (scope === "movements") {
    const transactions = await db.inventoryTransaction.findMany({
      where: {
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
      } satisfies Prisma.InventoryTransactionWhereInput,
      orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
      select: {
        transactionDate: true,
        type: true,
        quantity: true,
        unitCost: true,
        totalCost: true,
        notes: true,
        inventoryPart: {
          select: {
            name: true,
            sku: true,
            category: true,
            defaultSupplierName: true,
          },
        },
      },
    });

    const rows = transactions.map((transaction) => ({
      transactionDate: transaction.transactionDate.toISOString().slice(0, 10),
      partName: transaction.inventoryPart.name,
      sku: transaction.inventoryPart.sku || "",
      category: transaction.inventoryPart.category || "",
      movementType: transaction.type,
      quantity: transaction.quantity,
      unitCost: transaction.unitCost == null ? "" : transaction.unitCost / 100,
      totalCost: transaction.totalCost == null ? "" : transaction.totalCost / 100,
      supplier: transaction.inventoryPart.defaultSupplierName || "",
      notes: transaction.notes || "",
    }));

    return new Response(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="inventory-movements.csv"`,
      },
    });
  }

  const settings = await getFleetOperationsSettings();
  const rawParts = await db.inventoryPart.findMany({
    where: {
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
    } satisfies Prisma.InventoryPartWhereInput,
    orderBy: [{ quantityInStock: "asc" }, { name: "asc" }],
    select: {
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
      tireBrandModel: true,
    },
  });

  const parts = rawParts.filter((part) => {
    const threshold = part.reorderThreshold ?? settings.defaultLowStockThreshold;
    if (selectedStock === "OUT_OF_STOCK") return part.quantityInStock <= 0;
    if (selectedStock === "LOW_STOCK") return part.quantityInStock <= threshold;
    if (selectedStock === "IN_STOCK") return part.quantityInStock > 0;
    return true;
  });

  const rows = parts.map((part) => {
    const threshold = part.reorderThreshold ?? settings.defaultLowStockThreshold;
    const stockStatus = part.quantityInStock <= 0 ? "OUT_OF_STOCK" : part.quantityInStock <= threshold ? "LOW_STOCK" : "IN_STOCK";
    return {
      partName: part.name,
      sku: part.sku || "",
      category: part.category || "",
      brand: part.brand || "",
      unit: part.unit || "",
      quantityInStock: part.quantityInStock,
      reorderThreshold: threshold,
      stockStatus,
      averageUnitCost: part.averageUnitCost == null ? "" : part.averageUnitCost / 100,
      stockValue: part.averageUnitCost == null ? "" : (part.averageUnitCost / 100) * part.quantityInStock,
      supplier: part.defaultSupplierName || "",
      tireRelated: part.isTireRelated ? "YES" : "NO",
      tireBrandModel: part.tireBrandModel || "",
    };
  });

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inventory-parts.csv"`,
    },
  });
}

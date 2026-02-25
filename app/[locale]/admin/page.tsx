import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guards";
import { isLicenseActive } from "@/lib/license";
import { db } from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingsTable } from "@/components/admin/BookingsTable";
import { VehiclesTable } from "@/components/admin/VehiclesTable";
import { CategoriesTable } from "@/components/admin/CategoriesTable";
import { ExtrasTable } from "@/components/admin/ExtrasTable";
import { DiscountCodesTable } from "@/components/admin/DiscountCodesTable";
import { ReviewsTable } from "@/components/admin/ReviewsTable";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth";
import { getBlobProxyUrl } from "@/lib/blob";
import { formatDateTime } from "@/lib/datetime";
import { FinancialFilters } from "@/components/admin/FinancialFilters";
import { SendBillingEmailButton } from "@/components/admin/SendBillingEmailButton";
import { TaxSettingsCard } from "@/components/admin/TaxSettingsCard";
import { FleetDashboard } from "@/components/admin/FleetDashboard";
import { getMinBookingDays, getTaxPercentage } from "@/lib/settings";
import Link from "next/link";
import {
  Car,
  CarFront,
  CheckCircle2,
  CirclePlus,
  ClipboardList,
  Clock3,
  DollarSign,
  FileText,
  Grid2X2,
  ListChecks,
  LogOut,
  Percent,
  Settings,
  Star,
  Tag,
  Truck,
  Undo2,
  XCircle,
} from "lucide-react";

const DEFAULT_ADMIN_PAGE_SIZE = 20;
const ADMIN_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

function toPositiveInt(value: string | undefined, fallback = 1) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toPageSize(value: string | undefined) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) return DEFAULT_ADMIN_PAGE_SIZE;
  return (ADMIN_PAGE_SIZE_OPTIONS as readonly number[]).includes(parsed) ? parsed : DEFAULT_ADMIN_PAGE_SIZE;
}

export default async function AdminDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    start?: string;
    end?: string;
    tab?: string;
    bookings_status?: string;
    pending_page?: string;
    confirmed_page?: string;
    declined_page?: string;
    deliveries_page?: string;
    returns_page?: string;
    logs_page?: string;
    page_size?: string;
    vehicles_subtab?: string;
    vehicles_page?: string;
    categories_page?: string;
    extras_page?: string;
    discounts_page?: string;
    reviews_page?: string;
  }>;
}) {
  const { locale } = await params;
  const {
    start,
    end,
    tab,
    bookings_status,
    pending_page,
    confirmed_page,
    declined_page,
    deliveries_page,
    returns_page,
    logs_page,
    page_size,
    vehicles_subtab,
    vehicles_page,
    categories_page,
    extras_page,
    discounts_page,
    reviews_page,
  } = await searchParams;
  const activeBookingsStatus =
    bookings_status === "confirmed" || bookings_status === "declined" ? bookings_status : "pending";
  const pendingPage = toPositiveInt(pending_page);
  const confirmedPage = toPositiveInt(confirmed_page);
  const declinedPage = toPositiveInt(declined_page);
  const deliveriesPage = toPositiveInt(deliveries_page);
  const returnsPage = toPositiveInt(returns_page);
  const logsPage = toPositiveInt(logs_page);
  const pageSize = toPageSize(page_size);
  const activeVehiclesSubtab =
    vehicles_subtab && ["manage", "pricing", "categories", "extras", "discounts"].includes(vehicles_subtab)
      ? vehicles_subtab
      : "manage";
  const vehiclesPage = toPositiveInt(vehicles_page);
  const categoriesPage = toPositiveInt(categories_page);
  const extrasPage = toPositiveInt(extras_page);
  const discountsPage = toPositiveInt(discounts_page);
  const reviewsPage = toPositiveInt(reviews_page);
  const t = await getTranslations();
  const tOr = (key: string, values: Record<string, any>, fallback: string) =>
    t.has(key as any) ? t(key as any, values as any) : fallback;

  // Check admin access
  const admin = await requireAdmin(locale);

  // Check license
  const licenseActive = isLicenseActive();
  if (!licenseActive && admin.role !== "ROOT") {
    redirect(`/${locale}/admin/billing-required`);
  }
  const adminUser = await db.adminUser.findUnique({
    where: { id: admin.userId },
    select: { email: true },
  });

  const now = new Date();
  const sevenDays = new Date(now);
  sevenDays.setDate(sevenDays.getDate() + 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const parseDateInput = (value: string | undefined, endOfDay: boolean) => {
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
  let financialStartDate = parseDateInput(start, false) || monthStart;
  let financialEndDate = parseDateInput(end, true) || now;
  if (financialStartDate > financialEndDate) {
    const tmp = financialStartDate;
    financialStartDate = new Date(financialEndDate);
    financialEndDate = new Date(tmp);
  }
  const financialStartInput = toInputDate(financialStartDate);
  const financialEndInput = toInputDate(financialEndDate);
  const buildAdminHref = (updates: Record<string, string | number | null | undefined>) => {
    const qp = new URLSearchParams();
    if (start) qp.set("start", start);
    if (end) qp.set("end", end);
    if (tab) qp.set("tab", tab);
    if (bookings_status) qp.set("bookings_status", bookings_status);
    if (pending_page) qp.set("pending_page", pending_page);
    if (confirmed_page) qp.set("confirmed_page", confirmed_page);
    if (declined_page) qp.set("declined_page", declined_page);
    if (deliveries_page) qp.set("deliveries_page", deliveries_page);
    if (returns_page) qp.set("returns_page", returns_page);
    if (logs_page) qp.set("logs_page", logs_page);
    if (page_size) qp.set("page_size", page_size);
    if (vehicles_subtab) qp.set("vehicles_subtab", vehicles_subtab);
    if (vehicles_page) qp.set("vehicles_page", vehicles_page);
    if (categories_page) qp.set("categories_page", categories_page);
    if (extras_page) qp.set("extras_page", extras_page);
    if (discounts_page) qp.set("discounts_page", discounts_page);
    if (reviews_page) qp.set("reviews_page", reviews_page);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        qp.delete(key);
      } else {
        qp.set(key, String(value));
      }
    });
    return `/${locale}/admin?${qp.toString()}`;
  };
  const renderPagination = (
    page: number,
    total: number,
    pageParam: string,
    extraUpdates: Record<string, string | number | null | undefined> = {}
  ) => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const startRow = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const endRow = Math.min(total, safePage * pageSize);

    return (
      <div className="mb-3 flex flex-col gap-2 text-sm md:flex-row md:items-center md:justify-between">
        <div className="text-muted-foreground">
          Showing {startRow}-{endRow} of {total}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Rows:</span>
          {ADMIN_PAGE_SIZE_OPTIONS.map((size) => (
            <Link
              key={size}
              className={`inline-flex h-8 items-center rounded-md border px-2 text-xs ${
                pageSize === size ? "bg-accent font-medium" : "hover:bg-accent"
              }`}
              href={buildAdminHref({ ...extraUpdates, page_size: size, [pageParam]: 1 })}
            >
              {size}
            </Link>
          ))}
          {safePage > 1 ? (
            <Link
              className="inline-flex h-8 items-center rounded-md border px-3 text-sm hover:bg-accent"
              href={buildAdminHref({ ...extraUpdates, [pageParam]: safePage - 1 })}
            >
              Prev
            </Link>
          ) : (
            <span className="inline-flex h-8 items-center rounded-md border px-3 text-sm text-muted-foreground">
              Prev
            </span>
          )}
          <span className="px-2 text-muted-foreground">
            {safePage}/{totalPages}
          </span>
          {safePage < totalPages ? (
            <Link
              className="inline-flex h-8 items-center rounded-md border px-3 text-sm hover:bg-accent"
              href={buildAdminHref({ ...extraUpdates, [pageParam]: safePage + 1 })}
            >
              Next
            </Link>
          ) : (
            <span className="inline-flex h-8 items-center rounded-md border px-3 text-sm text-muted-foreground">
              Next
            </span>
          )}
        </div>
      </div>
    );
  };
  const withOperationalState = async <T extends { id: string; paymentReceivedAt?: Date | null }>(
    rows: T[]
  ) => {
    if (rows.length === 0) {
      return rows.map((row) => ({ ...row, deliveredAt: null, returnedAt: null }));
    }
    const ids = rows.map((row) => row.id);
    try {
      const opRows = await db.$queryRawUnsafe<
        Array<{
          id: string;
          paymentReceivedAt: Date | null;
          deliveredAt: Date | null;
          returnedAt: Date | null;
        }>
      >(
        `SELECT id, "paymentReceivedAt", "deliveredAt", "returnedAt"
         FROM "Booking"
         WHERE id IN (${ids.map((_, i) => `$${i + 1}`).join(",")})`,
        ...ids
      );
      const opMap = new Map(opRows.map((row) => [row.id, row]));
      return rows.map((row) => {
        const op = opMap.get(row.id);
        return {
          ...row,
          paymentReceivedAt: op?.paymentReceivedAt ?? row.paymentReceivedAt ?? null,
          deliveredAt: op?.deliveredAt ?? null,
          returnedAt: op?.returnedAt ?? null,
        };
      });
    } catch {
      return rows.map((row) => ({
        ...row,
        paymentReceivedAt: row.paymentReceivedAt ?? null,
        deliveredAt: null,
        returnedAt: null,
      }));
    }
  };

  // Fetch bookings by status (server-side paginated)
  const [
    pendingTotal,
    confirmedTotal,
    declinedTotal,
    pending,
    confirmed,
    declined,
  ] = await Promise.all([
    db.booking.count({ where: { status: "PENDING" } }),
    db.booking.count({ where: { status: "CONFIRMED" } }),
    db.booking.count({ where: { status: "DECLINED" } }),
    db.booking.findMany({
      where: { status: "PENDING" },
      include: { vehicle: true, category: true },
      orderBy: { createdAt: "desc" },
      skip: (pendingPage - 1) * pageSize,
      take: pageSize,
    }),
    db.booking.findMany({
      where: { status: "CONFIRMED" },
      include: { vehicle: true, category: true },
      orderBy: { createdAt: "desc" },
      skip: (confirmedPage - 1) * pageSize,
      take: pageSize,
    }),
    db.booking.findMany({
      where: { status: "DECLINED" },
      include: { vehicle: true, category: true },
      orderBy: { createdAt: "desc" },
      skip: (declinedPage - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  // Operational dashboards (server-side paginated)
  const deliveriesWhere = {
    status: "CONFIRMED" as const,
    startDate: { gte: now, lte: sevenDays },
  };
  const returnsWhere = {
    status: "CONFIRMED" as const,
    endDate: { gte: now, lte: sevenDays },
  };
  const [deliveriesTotal, returnsTotal, deliveriesRaw, returnsRaw] = await Promise.all([
    db.booking.count({ where: deliveriesWhere }),
    db.booking.count({ where: returnsWhere }),
    db.booking.findMany({
      where: deliveriesWhere,
      include: { vehicle: true, category: true, pickupLocationRef: true },
      orderBy: { startDate: "asc" },
      skip: (deliveriesPage - 1) * pageSize,
      take: pageSize,
    }),
    db.booking.findMany({
      where: returnsWhere,
      include: { vehicle: true, category: true, dropoffLocationRef: true },
      orderBy: { endDate: "asc" },
      skip: (returnsPage - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  const deliveries = await withOperationalState(deliveriesRaw as any);
  const returns = await withOperationalState(returnsRaw as any);

  // Financial dashboard
  const [confirmedRevenueAgg, pendingPipelineAgg, monthRevenueAgg, paidRevenueAgg] = await Promise.all([
    db.booking.aggregate({
      where: { status: "CONFIRMED", createdAt: { gte: financialStartDate, lte: financialEndDate } },
      _sum: { totalAmount: true },
    }),
    db.booking.aggregate({
      where: { status: "PENDING", createdAt: { gte: financialStartDate, lte: financialEndDate } },
      _sum: { totalAmount: true },
    }),
    db.booking.aggregate({
      where: { status: "CONFIRMED", createdAt: { gte: financialStartDate, lte: financialEndDate } },
      _sum: { totalAmount: true },
    }),
    db.booking.aggregate({
      where: { invoiceUrl: { not: null }, createdAt: { gte: financialStartDate, lte: financialEndDate } },
      _sum: { totalAmount: true },
    }),
  ]);
  const [confirmedCount, pendingCount, paidConfirmedCount] = await Promise.all([
    db.booking.count({
      where: { status: "CONFIRMED", createdAt: { gte: financialStartDate, lte: financialEndDate } },
    }),
    db.booking.count({
      where: { status: "PENDING", createdAt: { gte: financialStartDate, lte: financialEndDate } },
    }),
    db.booking.count({
      where: {
        status: "CONFIRMED",
        invoiceUrl: { not: null },
        createdAt: { gte: financialStartDate, lte: financialEndDate },
      },
    }),
  ]);
  const unpaidConfirmedCount = confirmedCount - paidConfirmedCount;
  const avgConfirmedValue = confirmedCount > 0 ? Math.round((confirmedRevenueAgg._sum.totalAmount ?? 0) / confirmedCount) : 0;
  const conversionRate =
    pendingCount + confirmedCount > 0
      ? Math.round((confirmedCount / (pendingCount + confirmedCount)) * 100)
      : 0;
  const recentInvoices = await db.booking.findMany({
    where: { invoiceUrl: { not: null }, createdAt: { gte: financialStartDate, lte: financialEndDate } },
    select: {
      id: true,
      bookingCode: true,
      customerName: true,
      customerEmail: true,
      totalAmount: true,
      invoiceUrl: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  // Fleet dashboard
  const [totalVehicles, activeVehicles] = await Promise.all([
    db.vehicle.count(),
    db.vehicle.count({ where: { status: "ACTIVE" } }),
  ]);
  let onRentNow = 0;
  try {
    onRentNow = await db.vehicle.count({ where: { status: "ON_RENT" } as any });
  } catch {
    // Fallback for older schemas/enums: infer from active bookings.
    onRentNow = await db.booking.count({
      where: {
        OR: [
          {
            status: "CONFIRMED",
            startDate: { lte: now },
            endDate: { gt: now },
          },
          {
            status: "PENDING",
            startDate: { lte: now },
            endDate: { gt: now },
            holdExpiresAt: { gt: now },
          },
        ],
      },
    });
  }
  const expectedDemandByCategory = await db.booking.groupBy({
    by: ["categoryId"],
    where: { status: { in: ["PENDING", "CONFIRMED"] }, startDate: { gte: now, lte: sevenDays } },
    _count: { _all: true },
  });
  const categories = await db.vehicleCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  const [categoriesTotal, allCategoryRows] = await Promise.all([
    db.vehicleCategory.count(),
    db.vehicleCategory.findMany({
      include: {
        _count: {
          select: { vehicles: true, bookings: true },
        },
      },
      orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }],
      skip: (categoriesPage - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  const categoryNameMap = new Map(categories.map((category) => [category.id, category.name]));
  let extrasTotal = 0;
  let extras: Array<any> = [];
  if ((db as any).extra && typeof (db as any).extra.findMany === "function") {
    try {
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
    } catch {
      extrasTotal = 0;
      extras = [];
    }
  } else {
    try {
      const countRows = await db.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int AS count FROM "Extra"
      `;
      extrasTotal = countRows?.[0]?.count ?? 0;
      extras = await db.$queryRawUnsafe<Array<any>>(
        `SELECT id, name, description, "pricingType", amount, "isActive", "createdAt"
         FROM "Extra"
         ORDER BY "createdAt" DESC
         LIMIT $1 OFFSET $2`,
        pageSize,
        (extrasPage - 1) * pageSize
      );
    } catch {
      extrasTotal = 0;
      extras = [];
    }
  }

  let discountCodesTotal = 0;
  let discountCodes: Array<any> = [];
  if ((db as any).discountCode && typeof (db as any).discountCode.findMany === "function") {
    try {
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
    } catch {
      discountCodesTotal = 0;
      discountCodes = [];
    }
  } else {
    try {
      const countRows = await db.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int AS count FROM "DiscountCode"
      `;
      discountCodesTotal = countRows?.[0]?.count ?? 0;
      discountCodes = await db.$queryRawUnsafe<Array<any>>(
        `SELECT id, code, description, percentage, "isActive", "maxUses", "usedCount", "expiresAt", "createdAt"
         FROM "DiscountCode"
         ORDER BY "createdAt" DESC
         LIMIT $1 OFFSET $2`,
        pageSize,
        (discountsPage - 1) * pageSize
      );
    } catch {
      discountCodesTotal = 0;
      discountCodes = [];
    }
  }
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);
  const returnsToday = await db.booking.count({
    where: {
      status: "CONFIRMED",
      endDate: { gte: dayStart, lte: dayEnd },
    },
  });
  const topDemand = [...expectedDemandByCategory].sort((a, b) => b._count._all - a._count._all).slice(0, 3);
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const previousNow = new Date(now.getTime() - weekMs);
  const previousWeekStart = new Date(previousNow.getTime() - weekMs);
  const previousDayStart = new Date(dayStart.getTime() - weekMs);
  const previousDayEnd = new Date(dayEnd.getTime() - weekMs);
  const [
    activeVehiclesPrev,
    onRentNowPrev,
    returnsTodayPrev,
    expectedDemandPreviousWeek,
    deliveriesTotalPrev,
    returnsTotalPrev,
    overdueReturns,
    overdueReturnsPrev,
  ] = await Promise.all([
    db.vehicle.count({ where: { status: "ACTIVE", createdAt: { lte: previousNow } } }),
    db.booking.count({
      where: {
        OR: [
          {
            status: "CONFIRMED",
            startDate: { lte: previousNow },
            endDate: { gt: previousNow },
          },
          {
            status: "PENDING",
            startDate: { lte: previousNow },
            endDate: { gt: previousNow },
            holdExpiresAt: { gt: previousNow },
          },
        ],
      },
    }),
    db.booking.count({
      where: {
        status: "CONFIRMED",
        endDate: { gte: previousDayStart, lte: previousDayEnd },
      },
    }),
    db.booking.groupBy({
      by: ["categoryId"],
      where: { status: { in: ["PENDING", "CONFIRMED"] }, startDate: { gte: previousWeekStart, lte: previousNow } },
      _count: { _all: true },
    }),
    db.booking.count({
      where: {
        status: "CONFIRMED",
        startDate: { gte: previousNow, lte: now },
      },
    }),
    db.booking.count({
      where: {
        status: "CONFIRMED",
        endDate: { gte: previousNow, lte: now },
      },
    }),
    db.booking.count({
      where: {
        status: "CONFIRMED",
        endDate: { lt: now },
      },
    }),
    db.booking.count({
      where: {
        status: "CONFIRMED",
        endDate: { lt: previousNow },
      },
    }),
  ]);
  const topDemandPrev = [...expectedDemandPreviousWeek].sort((a, b) => b._count._all - a._count._all).slice(0, 1);
  const topDemandCurrentCount = topDemand[0]?._count._all ?? 0;
  const topDemandPrevCount = topDemandPrev[0]?._count._all ?? 0;
  const expectedDemandTotal = expectedDemandByCategory.reduce((sum, row) => sum + row._count._all, 0);
  const expectedDemandPrevTotal = expectedDemandPreviousWeek.reduce((sum, row) => sum + row._count._all, 0);
  const demandByCategory = expectedDemandByCategory
    .map((row) => ({
      label: categoryNameMap.get(row.categoryId) || row.categoryId,
      count: row._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  // Vehicle management tab data (server-side paginated)
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
  const vehicleCategories = categories.map((category) => ({ id: category.id, name: category.name }));
  const [reviewsTotal, reviews] = await Promise.all([
    db.review.count(),
    db.review.findMany({
      orderBy: { createdAt: "desc" },
      skip: (reviewsPage - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  const [auditLogsTotal, auditLogs] = await Promise.all([
    db.auditLog.count(),
    db.auditLog.findMany({
      include: {
        adminUser: {
          select: {
            email: true,
            role: true,
          },
        },
        booking: {
          select: {
            bookingCode: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (logsPage - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  const [taxPercentage, minimumBookingDays] = await Promise.all([
    getTaxPercentage(),
    getMinBookingDays(),
  ]);

  const currency = (amountCents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amountCents / 100);
  const utilizationPct = totalVehicles > 0 ? Math.round((onRentNow / totalVehicles) * 100) : 0;
  const utilizationPrevPct = activeVehiclesPrev > 0 ? Math.round((onRentNowPrev / activeVehiclesPrev) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("admin.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tOr("admin.dashboard.header.welcome", { user: adminUser?.email || admin.userId }, `Welcome, ${adminUser?.email || admin.userId}`)}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {tOr("admin.dashboard.header.role", { role: admin.role }, `Role: ${admin.role}`)}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${licenseActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {licenseActive ? t("admin.dashboard.header.licenseActive") : t("admin.dashboard.header.licenseSuspended")}
            </span>
          </div>
        </div>
        <form action={logoutAction.bind(null, locale)}>
          <Button type="submit" variant="outline" className="inline-flex items-center gap-1.5">
            <LogOut className="h-4 w-4" />
            {t("nav.logout")}
          </Button>
        </form>
      </div>

      <Tabs
        defaultValue={
          tab && ["bookings", "deliveries", "returns", "financial", "fleet", "vehicles", "reviews", "settings", "logs"].includes(tab)
            ? tab
            : "bookings"
        }
        className="w-full"
      >
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="bookings"><ClipboardList className="h-4 w-4" />{t("admin.dashboard.tabs.bookings")}</TabsTrigger>
          <TabsTrigger value="deliveries"><Truck className="h-4 w-4" />{t("admin.dashboard.tabs.deliveries")}</TabsTrigger>
          <TabsTrigger value="returns"><Undo2 className="h-4 w-4" />{t("admin.dashboard.tabs.returns")}</TabsTrigger>
          <TabsTrigger value="financial"><DollarSign className="h-4 w-4" />{t("admin.dashboard.tabs.financial")}</TabsTrigger>
          <TabsTrigger value="fleet"><CarFront className="h-4 w-4" />{t("admin.dashboard.tabs.fleet")}</TabsTrigger>
          <TabsTrigger value="vehicles"><Car className="h-4 w-4" />{t("admin.dashboard.tabs.vehicles")}</TabsTrigger>
          <TabsTrigger value="reviews"><Star className="h-4 w-4" />{t("admin.dashboard.tabs.reviews")}</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="h-4 w-4" />{t("admin.dashboard.tabs.settings")}</TabsTrigger>
          <TabsTrigger value="logs"><FileText className="h-4 w-4" />Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-6">
          <Tabs defaultValue={activeBookingsStatus}>
            <TabsList>
              <TabsTrigger value="pending"><Clock3 className="h-4 w-4" />{t("admin.tabs.pending")} ({pendingTotal})</TabsTrigger>
              <TabsTrigger value="confirmed"><CheckCircle2 className="h-4 w-4" />{t("admin.tabs.confirmed")} ({confirmedTotal})</TabsTrigger>
              <TabsTrigger value="declined"><XCircle className="h-4 w-4" />{t("admin.tabs.declined")} ({declinedTotal})</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
              {renderPagination(pendingPage, pendingTotal, "pending_page", {
                tab: "bookings",
                bookings_status: "pending",
              })}
              <BookingsTable bookings={pending} locale={locale} status="PENDING" />
            </TabsContent>
            <TabsContent value="confirmed">
              {renderPagination(confirmedPage, confirmedTotal, "confirmed_page", {
                tab: "bookings",
                bookings_status: "confirmed",
              })}
              <BookingsTable bookings={confirmed} locale={locale} status="CONFIRMED" />
            </TabsContent>
            <TabsContent value="declined">
              {renderPagination(declinedPage, declinedTotal, "declined_page", {
                tab: "bookings",
                bookings_status: "declined",
              })}
              <BookingsTable bookings={declined} locale={locale} status="DECLINED" />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="deliveries" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">{t("admin.dashboard.deliveries.title")}</h2>
          {renderPagination(deliveriesPage, deliveriesTotal, "deliveries_page", { tab: "deliveries" })}
          <BookingsTable bookings={deliveries as any} locale={locale} status="CONFIRMED" dateMode="pickup" actionMode="deliveries" />
        </TabsContent>

        <TabsContent value="returns" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">{t("admin.dashboard.returns.title")}</h2>
          {renderPagination(returnsPage, returnsTotal, "returns_page", { tab: "returns" })}
          <BookingsTable bookings={returns as any} locale={locale} status="CONFIRMED" dateMode="dropoff" actionMode="returns" />
        </TabsContent>

        <TabsContent value="financial" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">{t("admin.dashboard.financial.title")}</h2>
          <FinancialFilters initialStart={financialStartInput} initialEnd={financialEndInput} />
          <p className="mb-4 text-xs text-muted-foreground">
            Filter range: {formatDateTime(financialStartDate)} to {formatDateTime(financialEndDate)}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">{t("admin.dashboard.financial.confirmedRevenue")}</p>
              <p className="text-2xl font-bold">{currency(confirmedRevenueAgg._sum.totalAmount ?? 0)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">{t("admin.dashboard.financial.pendingPipeline")}</p>
              <p className="text-2xl font-bold">{currency(pendingPipelineAgg._sum.totalAmount ?? 0)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">{t("admin.dashboard.financial.monthRevenue")}</p>
              <p className="text-2xl font-bold">{currency(monthRevenueAgg._sum.totalAmount ?? 0)}</p>
            </Card>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-emerald-50 to-white">
              <p className="text-sm text-muted-foreground">Collected Revenue</p>
              <p className="text-xl font-bold">{currency(paidRevenueAgg._sum.totalAmount ?? 0)}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-amber-50 to-white">
              <p className="text-sm text-muted-foreground">Unpaid Confirmed</p>
              <p className="text-xl font-bold">{unpaidConfirmedCount}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-white">
              <p className="text-sm text-muted-foreground">Average Booking</p>
              <p className="text-xl font-bold">{currency(avgConfirmedValue)}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-violet-50 to-white">
              <p className="text-sm text-muted-foreground">Pending→Confirmed</p>
              <p className="text-xl font-bold">{conversionRate}%</p>
            </Card>
          </div>
          <Card className="mt-4 p-4">
            <p className="font-semibold mb-3">Recent Billing Documents</p>
            <div className="space-y-2">
              {recentInvoices.length === 0 && (
                <p className="text-sm text-muted-foreground">No billing documents yet.</p>
              )}
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium">{inv.bookingCode} · {inv.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {currency(inv.totalAmount)} · {formatDateTime(inv.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <a href={getBlobProxyUrl(inv.invoiceUrl, { download: true }) || undefined} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View PDF</a>
                    <SendBillingEmailButton
                      bookingId={inv.id}
                      locale={locale}
                      label="Send by Email"
                      className="h-auto p-0 text-blue-600 hover:text-blue-700 hover:underline"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="fleet" className="mt-6 space-y-6">
          <h2 className="text-xl font-semibold">{t("admin.dashboard.fleet.title")}</h2>
          <FleetDashboard
            activeVehicles={activeVehicles}
            activeVehiclesPrev={activeVehiclesPrev}
            onRentNow={onRentNow}
            onRentNowPrev={onRentNowPrev}
            utilizationPct={utilizationPct}
            utilizationPrevPct={utilizationPrevPct}
            pickups7d={deliveriesTotal}
            pickups7dPrev={deliveriesTotalPrev}
            returns7d={returnsTotal}
            returns7dPrev={returnsTotalPrev}
            returnsToday={returnsToday}
            returnsTodayPrev={returnsTodayPrev}
            overdueReturns={overdueReturns}
            overdueReturnsPrev={overdueReturnsPrev}
            expectedDemandTotal={expectedDemandTotal}
            expectedDemandPrevTotal={expectedDemandPrevTotal}
            topDemandLabel={topDemand[0] ? `${categoryNameMap.get(topDemand[0].categoryId) || topDemand[0].categoryId} (${topDemand[0]._count._all})` : "-"}
            topDemandCurrentCount={topDemandCurrentCount}
            topDemandPrevCount={topDemandPrevCount}
            demandByCategory={demandByCategory}
          />
        </TabsContent>

        <TabsContent value="vehicles" className="mt-6">
          <Tabs defaultValue={activeVehiclesSubtab}>
            <TabsList>
              <TabsTrigger value="manage"><ListChecks className="h-4 w-4" />{t("admin.dashboard.vehicles.manage")}</TabsTrigger>
              <TabsTrigger value="pricing"><Tag className="h-4 w-4" />{t("admin.dashboard.vehicles.pricing")}</TabsTrigger>
              <TabsTrigger value="categories"><Grid2X2 className="h-4 w-4" />Categories</TabsTrigger>
              <TabsTrigger value="extras"><CirclePlus className="h-4 w-4" />Extras</TabsTrigger>
              <TabsTrigger value="discounts"><Percent className="h-4 w-4" />Discounts</TabsTrigger>
            </TabsList>
            <TabsContent value="manage" className="mt-4">
              {renderPagination(vehiclesPage, vehiclesTotal, "vehicles_page", {
                tab: "vehicles",
                vehicles_subtab: "manage",
              })}
              <VehiclesTable vehicles={transformedVehicles} categories={vehicleCategories} locale={locale} />
            </TabsContent>
            <TabsContent value="pricing" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            </TabsContent>
            <TabsContent value="categories" className="mt-4">
              {renderPagination(categoriesPage, categoriesTotal, "categories_page", {
                tab: "vehicles",
                vehicles_subtab: "categories",
              })}
              <CategoriesTable categories={allCategoryRows as any} locale={locale} />
            </TabsContent>
            <TabsContent value="extras" className="mt-4">
              {renderPagination(extrasPage, extrasTotal, "extras_page", {
                tab: "vehicles",
                vehicles_subtab: "extras",
              })}
              <ExtrasTable extras={extras as any} locale={locale} />
            </TabsContent>
            <TabsContent value="discounts" className="mt-4">
              {renderPagination(discountsPage, discountCodesTotal, "discounts_page", {
                tab: "vehicles",
                vehicles_subtab: "discounts",
              })}
              <DiscountCodesTable discountCodes={discountCodes as any} locale={locale} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6 space-y-4">
          <h2 className="text-xl font-semibold">{t("admin.dashboard.reviews.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("admin.dashboard.reviews.subtitle")}</p>
          {renderPagination(reviewsPage, reviewsTotal, "reviews_page", { tab: "reviews" })}
          <ReviewsTable reviews={reviews as any[]} locale={locale} />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <TaxSettingsCard
            locale={locale}
            initialTaxPercentage={taxPercentage}
            initialMinimumBookingDays={minimumBookingDays}
          />
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Admin Audit Logs</h2>
          {renderPagination(logsPage, auditLogsTotal, "logs_page", { tab: "logs" })}
          <Card className="p-4">
            {auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit logs found.</p>
            ) : (
              <div className="space-y-2">
                {auditLogs.map((entry) => (
                  <div key={entry.id} className="rounded-md border p-3 text-sm">
                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <p className="font-medium">
                        {entry.action}
                        {entry.booking?.bookingCode ? ` · ${entry.booking.bookingCode}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.adminUser.email} ({entry.adminUser.role})
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

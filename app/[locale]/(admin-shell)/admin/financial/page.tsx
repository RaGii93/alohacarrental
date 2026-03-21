import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { FinancialFilters } from "@/components/admin/FinancialFilters";
import { formatDateTime } from "@/lib/datetime";
import { SendBillingEmailButton } from "@/components/admin/SendBillingEmailButton";
import { getBlobProxyUrl } from "@/lib/blob";
import { requireAdminSection } from "@/app/[locale]/admin/_lib";

export default async function AdminFinancialPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const { locale } = await params;
  const { start, end } = await searchParams;
  const t = await getTranslations();
  await requireAdminSection(locale, "financial");
  const now = new Date();
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
  const financialStartDate = parseDateInput(start, false) || monthStart;
  const financialEndDate = parseDateInput(end, true) || now;
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
    db.booking.count({ where: { status: "CONFIRMED", createdAt: { gte: financialStartDate, lte: financialEndDate } } }),
    db.booking.count({ where: { status: "PENDING", createdAt: { gte: financialStartDate, lte: financialEndDate } } }),
    db.booking.count({ where: { status: "CONFIRMED", invoiceUrl: { not: null }, createdAt: { gte: financialStartDate, lte: financialEndDate } } }),
  ]);
  const unpaidConfirmedCount = confirmedCount - paidConfirmedCount;
  const avgConfirmedValue = confirmedCount > 0 ? Math.round((confirmedRevenueAgg._sum.totalAmount ?? 0) / confirmedCount) : 0;
  const conversionRate = pendingCount + confirmedCount > 0 ? Math.round((confirmedCount / (pendingCount + confirmedCount)) * 100) : 0;
  const recentInvoices = await db.booking.findMany({
    where: { invoiceUrl: { not: null }, createdAt: { gte: financialStartDate, lte: financialEndDate } },
    select: { id: true, bookingCode: true, customerName: true, totalAmount: true, invoiceUrl: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  const currency = (amountCents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amountCents / 100);

  return (
    <div className="w-full px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="mb-4 text-xl font-semibold">{t("admin.dashboard.financial.title")}</h2>
      <FinancialFilters initialStart={toInputDate(financialStartDate)} initialEnd={toInputDate(financialEndDate)} />
      <p className="mb-4 text-xs text-muted-foreground">Filter range: {formatDateTime(financialStartDate)} to {formatDateTime(financialEndDate)}</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4"><p className="text-sm text-muted-foreground">{t("admin.dashboard.financial.confirmedRevenue")}</p><p className="text-2xl font-bold">{currency(confirmedRevenueAgg._sum.totalAmount ?? 0)}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted-foreground">{t("admin.dashboard.financial.pendingPipeline")}</p><p className="text-2xl font-bold">{currency(pendingPipelineAgg._sum.totalAmount ?? 0)}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted-foreground">{t("admin.dashboard.financial.monthRevenue")}</p><p className="text-2xl font-bold">{currency(monthRevenueAgg._sum.totalAmount ?? 0)}</p></Card>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-white"><p className="text-sm text-muted-foreground">Collected Revenue</p><p className="text-xl font-bold">{currency(paidRevenueAgg._sum.totalAmount ?? 0)}</p></Card>
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-white"><p className="text-sm text-muted-foreground">Unpaid Confirmed</p><p className="text-xl font-bold">{unpaidConfirmedCount}</p></Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-white"><p className="text-sm text-muted-foreground">Average Booking</p><p className="text-xl font-bold">{currency(avgConfirmedValue)}</p></Card>
        <Card className="p-4 bg-gradient-to-br from-violet-50 to-white"><p className="text-sm text-muted-foreground">Pending→Confirmed</p><p className="text-xl font-bold">{conversionRate}%</p></Card>
      </div>
      <Card className="mt-4 p-4">
        <p className="mb-3 font-semibold">Recent Billing Documents</p>
        <div className="space-y-2">
          {recentInvoices.length === 0 && <p className="text-sm text-muted-foreground">No billing documents yet.</p>}
          {recentInvoices.map((inv) => (
            <div key={inv.id} className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium">{inv.bookingCode} · {inv.customerName}</p>
                <p className="text-xs text-muted-foreground">{currency(inv.totalAmount)} · {formatDateTime(inv.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <a href={getBlobProxyUrl(inv.invoiceUrl, { download: true }) || undefined} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View PDF</a>
                <SendBillingEmailButton bookingId={inv.id} locale={locale} label="Send by Email" className="h-auto p-0 text-blue-600 hover:text-blue-700 hover:underline" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

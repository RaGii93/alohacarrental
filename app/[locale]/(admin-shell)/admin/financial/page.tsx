import { Prisma } from "@prisma/client";
import { ArrowRightLeft, BadgeDollarSign, Clock3, FileText, HandCoins, ReceiptText, TrendingUp, Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { FinancialFilters } from "@/components/admin/FinancialFilters";
import { formatDateTime } from "@/lib/datetime";
import { SendBillingEmailButton } from "@/components/admin/SendBillingEmailButton";
import { getBlobProxyUrl } from "@/lib/blob";
import { getExternalRentalRecords } from "@/lib/external-rentals";
import {
  ADMIN_PAGE_KICKER,
  ADMIN_PAGE_META_TEXT,
  ADMIN_PAGE_SHELL,
  ADMIN_PAGE_STACK,
  requireAdminSection,
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

export default async function AdminFinancialPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    start?: string;
    end?: string;
    q?: string;
    booking_status?: string;
    billing_state?: string;
    transfer_state?: string;
  }>;
}) {
  const { locale } = await params;
  const { start, end, q, booking_status, billing_state, transfer_state } = await searchParams;
  const t = await getTranslations();
  await requireAdminSection(locale, "financial");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const financialStartDate = parseDateInput(start, false) || monthStart;
  const financialEndDate = parseDateInput(end, true) || now;
  const searchTerm = (q || "").trim();
  const selectedBookingStatus = booking_status === "CONFIRMED" || booking_status === "PENDING" ? booking_status : "";
  const selectedBillingState = billing_state === "INVOICED" || billing_state === "UNINVOICED" ? billing_state : "";
  const selectedTransferState = transfer_state === "PENDING" || transfer_state === "TRANSFERRED" ? transfer_state : "";

  const currency = (amountCents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amountCents / 100);
  const statCard = "admin-surface-soft rounded-[1.7rem] border-transparent p-5";

  const bookingSearchWhere: Prisma.BookingWhereInput = {
    createdAt: { gte: financialStartDate, lte: financialEndDate },
    ...(searchTerm
      ? {
          OR: [
            { bookingCode: { contains: searchTerm, mode: "insensitive" } },
            { customerName: { contains: searchTerm, mode: "insensitive" } },
            { customerEmail: { contains: searchTerm, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const billingFilter: Prisma.BookingWhereInput =
    selectedBillingState === "INVOICED"
      ? { invoiceUrl: { not: null } }
      : selectedBillingState === "UNINVOICED"
        ? { invoiceUrl: null }
        : {};

  const confirmedWhere = selectedBookingStatus && selectedBookingStatus !== "CONFIRMED"
    ? null
    : { ...bookingSearchWhere, ...billingFilter, status: "CONFIRMED" } satisfies Prisma.BookingWhereInput;

  const pendingWhere = selectedBookingStatus && selectedBookingStatus !== "PENDING"
    ? null
    : { ...bookingSearchWhere, ...billingFilter, status: "PENDING" } satisfies Prisma.BookingWhereInput;

  const invoicedWhere = selectedBookingStatus && selectedBookingStatus === "PENDING"
    ? null
    : { ...bookingSearchWhere, status: "CONFIRMED", invoiceUrl: { not: null } } satisfies Prisma.BookingWhereInput;

  const uninvoicedConfirmedWhere = selectedBookingStatus && selectedBookingStatus === "PENDING"
    ? null
    : { ...bookingSearchWhere, status: "CONFIRMED", invoiceUrl: null } satisfies Prisma.BookingWhereInput;

  const [confirmedRevenueAgg, pendingPipelineAgg, invoicedRevenueAgg, confirmedCount, pendingCount, invoicedConfirmedCount, uninvoicedConfirmedCount, recentInvoices, externalRows] = await Promise.all([
    confirmedWhere ? db.booking.aggregate({ where: confirmedWhere, _sum: { totalAmount: true } }) : Promise.resolve({ _sum: { totalAmount: 0 } }),
    pendingWhere ? db.booking.aggregate({ where: pendingWhere, _sum: { totalAmount: true } }) : Promise.resolve({ _sum: { totalAmount: 0 } }),
    invoicedWhere ? db.booking.aggregate({ where: invoicedWhere, _sum: { totalAmount: true } }) : Promise.resolve({ _sum: { totalAmount: 0 } }),
    confirmedWhere ? db.booking.count({ where: confirmedWhere }) : Promise.resolve(0),
    pendingWhere ? db.booking.count({ where: pendingWhere }) : Promise.resolve(0),
    invoicedWhere ? db.booking.count({ where: invoicedWhere }) : Promise.resolve(0),
    uninvoicedConfirmedWhere ? db.booking.count({ where: uninvoicedConfirmedWhere }) : Promise.resolve(0),
    db.booking.findMany({
      where: {
        ...bookingSearchWhere,
        invoiceUrl: { not: null },
        ...(selectedBookingStatus ? { status: selectedBookingStatus } : {}),
      },
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
    }),
    getExternalRentalRecords(financialStartDate, financialEndDate),
  ]);

  const avgConfirmedValue = confirmedCount > 0 ? Math.round((confirmedRevenueAgg._sum.totalAmount ?? 0) / confirmedCount) : 0;
  const conversionRate = pendingCount + confirmedCount > 0 ? Math.round((confirmedCount / (pendingCount + confirmedCount)) * 100) : 0;

  const filteredExternalRows = externalRows.filter((row) => {
    if (selectedTransferState && row.financialTransferStatus !== selectedTransferState) return false;
    if (!searchTerm) return true;
    const haystack = [
      row.bookingCode,
      row.customerName,
      row.customerEmail,
      row.supplierCompany,
      row.vehicleLabel,
    ].join(" ").toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });

  const externalSummary = filteredExternalRows.reduce(
    (acc, row) => {
      acc.totalIncome += row.incomeAmount;
      acc.totalExpense += row.expenseAmount;
      acc.totalProfit += row.profitAmount;
      if (row.financialTransferStatus === "PENDING") acc.pendingTransferCount += 1;
      return acc;
    },
    { totalIncome: 0, totalExpense: 0, totalProfit: 0, pendingTransferCount: 0 }
  );

  const activeFilterPills = [
    searchTerm ? t("admin.financial.pills.search", { value: searchTerm }) : "",
    selectedBookingStatus ? t("admin.financial.pills.booking", { value: selectedBookingStatus === "CONFIRMED" ? t("common.confirmed") : t("common.pending") }) : "",
    selectedBillingState ? t("admin.financial.pills.billing", { value: selectedBillingState === "INVOICED" ? t("admin.financial.filters.invoiced") : t("admin.financial.filters.uninvoiced") }) : "",
    selectedTransferState ? t("admin.financial.pills.transfer", { value: selectedTransferState === "TRANSFERRED" ? t("admin.financial.filters.transferred") : t("admin.financial.filters.pendingTransfer") }) : "",
  ].filter(Boolean);

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_PAGE_STACK}>
        <div>
          <p className={ADMIN_PAGE_KICKER}>{t("admin.dashboard.tabs.financial")}</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">{t("admin.financial.page.title")}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            {t("admin.financial.page.description")}
          </p>
        </div>

        <FinancialFilters
          initialStart={toInputDate(financialStartDate)}
          initialEnd={toInputDate(financialEndDate)}
          initialQuery={searchTerm}
          initialBookingStatus={selectedBookingStatus || "all"}
          initialBillingState={selectedBillingState || "all"}
          initialTransferState={selectedTransferState || "all"}
        />

        <Card className="admin-surface rounded-[1.8rem] border-transparent p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <p className={ADMIN_PAGE_META_TEXT}>
              {t("admin.financial.page.filterRange", { start: formatDateTime(financialStartDate), end: formatDateTime(financialEndDate) })}
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {activeFilterPills.length === 0 ? (
                <span className="admin-pill rounded-full px-3 py-1 font-medium">{t("admin.financial.page.noExtraFilters")}</span>
              ) : activeFilterPills.map((pill) => (
                <span key={pill} className="admin-pill rounded-full px-3 py-1 font-medium">
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: t("admin.financial.cards.confirmedRevenue"), value: currency(confirmedRevenueAgg._sum.totalAmount ?? 0), icon: BadgeDollarSign, tone: "bg-sky-50 text-sky-700" },
            { label: t("admin.financial.cards.invoicedRevenue"), value: currency(invoicedRevenueAgg._sum.totalAmount ?? 0), icon: FileText, tone: "bg-violet-50 text-violet-700" },
            { label: t("admin.financial.cards.pendingPipeline"), value: currency(pendingPipelineAgg._sum.totalAmount ?? 0), icon: Clock3, tone: "bg-amber-50 text-amber-700" },
            { label: t("admin.financial.cards.partnerRentalProfit"), value: currency(externalSummary.totalProfit), icon: TrendingUp, tone: "bg-emerald-50 text-emerald-700" },
          ].map((item) => (
            <Card key={item.label} className={statCard}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{item.value}</p>
                </div>
                <div className={`inline-flex size-12 items-center justify-center rounded-2xl ${item.tone}`}>
                  <item.icon className="size-5" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: t("admin.financial.cards.uninvoicedConfirmed"), value: uninvoicedConfirmedCount, icon: ReceiptText, tone: "bg-rose-50 text-rose-700" },
            { label: t("admin.financial.cards.averageConfirmedBooking"), value: currency(avgConfirmedValue), icon: Wallet, tone: "bg-slate-100 text-slate-700" },
            { label: t("admin.financial.cards.pendingToConfirmed"), value: `${conversionRate}%`, icon: ArrowRightLeft, tone: "bg-blue-50 text-blue-700" },
            { label: t("admin.financial.cards.partnerTransfersPending"), value: externalSummary.pendingTransferCount, icon: HandCoins, tone: "bg-fuchsia-50 text-fuchsia-700" },
          ].map((item) => (
            <Card key={item.label} className={statCard}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{item.value}</p>
                </div>
                <div className={`inline-flex size-12 items-center justify-center rounded-2xl ${item.tone}`}>
                  <item.icon className="size-5" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Card className="admin-surface rounded-[1.8rem] border-transparent p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">Recent billing documents</h2>
                <p className="mt-1 text-sm text-slate-600">{t("admin.financial.sections.billingDocumentsDescription")}</p>
              </div>
              <span className="admin-pill rounded-full px-3 py-1 text-xs font-medium">{t("admin.financial.sections.visibleCount", { count: recentInvoices.length })}</span>
            </div>

            <div className="mt-4 space-y-3">
              {recentInvoices.length === 0 ? (
                <p className="text-sm text-slate-500">{t("admin.financial.sections.noBillingDocuments")}</p>
              ) : recentInvoices.map((invoice) => (
                <div key={invoice.id} className="admin-surface-soft rounded-2xl border-transparent p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{invoice.bookingCode} · {invoice.customerName}</p>
                      <p className="mt-1 text-xs text-slate-500">{invoice.customerEmail}</p>
                      <p className="mt-2 text-sm text-slate-600">{currency(invoice.totalAmount)} · {formatDateTime(invoice.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <a
                        href={getBlobProxyUrl(invoice.invoiceUrl, { download: true }) || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-slate-700 hover:text-slate-900 hover:underline"
                      >
                        {t("admin.financial.actions.viewPdf")}
                      </a>
                      <SendBillingEmailButton
                        bookingId={invoice.id}
                        locale={locale}
                        label={t("admin.financial.actions.sendByEmail")}
                        className="h-auto p-0 font-medium text-slate-700 hover:text-slate-900 hover:underline"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="admin-surface rounded-[1.8rem] border-transparent p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">{t("admin.financial.sections.partnerLedgerTitle")}</h2>
                <p className="mt-1 text-sm text-slate-600">{t("admin.financial.sections.partnerLedgerDescription")}</p>
              </div>
              <span className="admin-pill rounded-full px-3 py-1 text-xs font-medium">{t("admin.financial.sections.visibleCount", { count: filteredExternalRows.length })}</span>
            </div>

            <div className="mt-4 space-y-3">
              {filteredExternalRows.length === 0 ? (
                <p className="text-sm text-slate-500">{t("admin.financial.sections.noPartnerRentals")}</p>
              ) : filteredExternalRows.map((row) => (
                <div key={row.id} className="admin-surface-soft rounded-2xl border-transparent p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{row.bookingCode} · {row.customerName}</p>
                        <p className="mt-1 text-xs text-slate-500">{row.supplierCompany} · {row.vehicleLabel}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${row.financialTransferStatus === "TRANSFERRED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {row.financialTransferStatus === "TRANSFERRED" ? t("admin.financial.filters.transferred") : t("admin.financial.filters.pendingTransfer")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {t("admin.financial.sections.partnerLedgerLine", {
                        income: currency(row.incomeAmount),
                        expense: currency(row.expenseAmount),
                        profit: currency(row.profitAmount),
                      })}
                    </p>
                    <p className="text-xs text-slate-500">{t("admin.financial.sections.createdAt", { date: formatDateTime(row.createdAt) })}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

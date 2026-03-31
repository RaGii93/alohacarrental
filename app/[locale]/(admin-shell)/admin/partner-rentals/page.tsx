import { Card } from "@/components/ui/card";
import { DateRangeFilters } from "@/components/admin/DateRangeFilters";
import { PartnerRentalsClient } from "@/components/admin/PartnerRentalsClient";
import { formatDateTime } from "@/lib/datetime";
import { getExternalRentalRecords, getExternalRentalSummary } from "@/lib/external-rentals";
import { getTranslations } from "next-intl/server";
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

export default async function AdminPartnerRentalsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const { locale } = await params;
  const { start, end } = await searchParams;
  const t = await getTranslations();
  await requireAdminSection(locale, "partner-rentals");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const startDate = parseDateInput(start, false) || monthStart;
  const endDate = parseDateInput(end, true) || now;

  const [rows, summary] = await Promise.all([
    getExternalRentalRecords(startDate, endDate),
    getExternalRentalSummary(startDate, endDate),
  ]);

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_PAGE_STACK}>
        <p className={ADMIN_PAGE_KICKER}>{t("admin.partnerRentals.page.kicker")}</p>
        <Card className="rounded-[1.6rem] border-0 bg-white p-5 shadow-[0_24px_56px_-32px_hsl(215_28%_17%/0.12)] ring-1 ring-[hsl(215_25%_27%/0.05)]">
          <DateRangeFilters initialStart={toInputDate(startDate)} initialEnd={toInputDate(endDate)} />
          <p className={`${ADMIN_PAGE_META_TEXT} mt-4`}>
            {t("admin.partnerRentals.page.filterRange", { start: formatDateTime(startDate), end: formatDateTime(endDate) })}
          </p>
        </Card>
        <PartnerRentalsClient
          locale={locale}
          summary={{
            totalIncome: Number(summary.totalIncome || 0),
            totalExpense: Number(summary.totalExpense || 0),
            totalProfit: Number(summary.totalProfit || 0),
            totalCount: Number(summary.totalCount || 0),
            pendingTransferCount: Number(summary.pendingTransferCount || 0),
          }}
          rows={rows.map((row) => ({
            id: row.id,
            bookingCode: row.bookingCode,
            supplierCompany: row.supplierCompany,
            vehicleLabel: row.vehicleLabel,
            customerName: row.customerName,
            customerEmail: row.customerEmail,
            customerPhone: row.customerPhone,
            startDate: row.startDate.toISOString(),
            endDate: row.endDate.toISOString(),
            pickupLocation: row.pickupLocation,
            dropoffLocation: row.dropoffLocation,
            incomeAmount: row.incomeAmount,
            expenseAmount: row.expenseAmount,
            profitAmount: row.profitAmount,
            financialTransferStatus: row.financialTransferStatus,
            status: row.status,
            paymentStatus: row.paymentStatus,
            paymentMethod: row.paymentMethod,
            paymentReference: row.paymentReference,
            paymentReceivedAt: row.paymentReceivedAt ? row.paymentReceivedAt.toISOString() : null,
            pickedUpAt: row.pickedUpAt ? row.pickedUpAt.toISOString() : null,
            returnedAt: row.returnedAt ? row.returnedAt.toISOString() : null,
            pickupNotes: row.pickupNotes,
            returnNotes: row.returnNotes,
            createdAt: row.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}

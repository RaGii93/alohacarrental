import Link from "next/link";
import { redirect } from "next/navigation";
import { QuickBooksTransfersClient } from "@/components/admin/QuickBooksTransfersClient";
import { db } from "@/lib/db";
import { ensureQuickBooksBookingColumns } from "@/lib/quickbooks-bookings";
import { getTranslations } from "next-intl/server";
import { getInvoiceProvider } from "@/lib/settings";
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

export default async function AdminQuickBooksPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ qb_status?: string; qb_page?: string; page_size?: string }>;
}) {
  const { locale } = await params;
  const { qb_status, qb_page, page_size } = await searchParams;
  const t = await getTranslations();
  await requireAdminSection(locale, "quickbooks");
  if ((await getInvoiceProvider()) !== "QUICKBOOKS") {
    redirect(`/${locale}/admin/bookings`);
  }
  await ensureQuickBooksBookingColumns();

  const requestedStatus =
    qb_status === "all"
      ? null
      : qb_status === "completed" || qb_status === "failed" || qb_status === "pending"
        ? qb_status.toUpperCase()
        : "PENDING";
  const currentStatusParam = requestedStatus ? requestedStatus.toLowerCase() : "all";
  const pageSize = toPageSize(page_size);
  const page = toPositiveInt(qb_page);

  const totalRowsResult = await db.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "Booking"
    WHERE "billingDocumentType" IS NOT NULL
      AND (${requestedStatus}::text IS NULL OR "quickBooksTransferStatus"::text = ${requestedStatus})
  `;
  const total = Number(totalRowsResult[0]?.count || 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const startRow = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endRow = Math.min(total, safePage * pageSize);

  const rows = await db.$queryRaw<Array<any>>`
    SELECT
      id,
      "bookingCode",
      "customerName",
      "totalAmount",
      "billingDocumentType",
      "quickBooksTransferStatus",
      "quickBooksDocumentType",
      "quickBooksLastError",
      "quickBooksSyncRequestedAt",
      "quickBooksSyncedAt",
      "paymentReceivedAt"
    FROM "Booking"
    WHERE "billingDocumentType" IS NOT NULL
      AND (${requestedStatus}::text IS NULL OR "quickBooksTransferStatus"::text = ${requestedStatus})
    ORDER BY
      CASE
        WHEN "quickBooksTransferStatus" = 'FAILED'::"QuickBooksTransferStatus" THEN 0
        WHEN "quickBooksTransferStatus" = 'PENDING'::"QuickBooksTransferStatus" THEN 1
        WHEN "quickBooksTransferStatus" = 'COMPLETED'::"QuickBooksTransferStatus" THEN 2
        ELSE 3
      END,
      COALESCE("quickBooksSyncRequestedAt", "createdAt") DESC
    OFFSET ${(safePage - 1) * pageSize}
    LIMIT ${pageSize}
  `;

  const buildHref = (updates: Record<string, string | number | undefined>) => {
    const qp = new URLSearchParams();
    qp.set("qb_status", currentStatusParam);
    qp.set("qb_page", String(safePage));
    qp.set("page_size", String(pageSize));
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") qp.delete(key);
      else qp.set(key, String(value));
    });
    return `/${locale}/admin/quickbooks?${qp.toString()}`;
  };

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_PAGE_STACK}>
      <div>
        <p className={ADMIN_PAGE_KICKER}>{t("admin.quickbooks.title")}</p>
        <p className={`mt-2 ${ADMIN_PAGE_META_TEXT}`}>
          {t("admin.quickbooks.pageDescription")}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link href={`/${locale}/admin/quickbooks?qb_status=all&qb_page=1&page_size=${pageSize}`} className={`${ADMIN_PAGE_ROWS_BUTTON} ${requestedStatus === null ? ADMIN_PAGE_ROWS_BUTTON_ACTIVE : ADMIN_PAGE_ROWS_BUTTON_IDLE}`}>
          {t("admin.quickbooks.filters.all")}
        </Link>
        <Link href={`/${locale}/admin/quickbooks?qb_status=pending&qb_page=1&page_size=${pageSize}`} className={`${ADMIN_PAGE_ROWS_BUTTON} ${requestedStatus === "PENDING" ? ADMIN_PAGE_ROWS_BUTTON_ACTIVE : ADMIN_PAGE_ROWS_BUTTON_IDLE}`}>
          {t("common.pending")}
        </Link>
        <Link href={`/${locale}/admin/quickbooks?qb_status=failed&qb_page=1&page_size=${pageSize}`} className={`${ADMIN_PAGE_ROWS_BUTTON} ${requestedStatus === "FAILED" ? ADMIN_PAGE_ROWS_BUTTON_ACTIVE : ADMIN_PAGE_ROWS_BUTTON_IDLE}`}>
          {t("admin.quickbooks.filters.failed")}
        </Link>
        <Link href={`/${locale}/admin/quickbooks?qb_status=completed&qb_page=1&page_size=${pageSize}`} className={`${ADMIN_PAGE_ROWS_BUTTON} ${requestedStatus === "COMPLETED" ? ADMIN_PAGE_ROWS_BUTTON_ACTIVE : ADMIN_PAGE_ROWS_BUTTON_IDLE}`}>
          {t("admin.quickbooks.filters.completed")}
        </Link>
      </div>

      <div className={ADMIN_PAGE_META_ROW}>
        <div className={ADMIN_PAGE_META_TEXT}>{t("admin.shared.showing", { start: startRow, end: endRow, total })}</div>
        <div className={ADMIN_PAGE_ROWS_WRAP}>
          <span className={ADMIN_PAGE_META_TEXT}>{t("admin.shared.rows")}</span>
          {ADMIN_PAGE_SIZE_OPTIONS.map((size) => (
            <Link
              key={size}
              className={`${ADMIN_PAGE_ROWS_BUTTON} ${pageSize === size ? ADMIN_PAGE_ROWS_BUTTON_ACTIVE : ADMIN_PAGE_ROWS_BUTTON_IDLE}`}
              href={buildHref({ page_size: size, qb_page: 1 })}
            >
              {size}
            </Link>
          ))}
        </div>
      </div>

      <QuickBooksTransfersClient rows={rows} locale={locale} />

      <div className={ADMIN_PAGE_PAGER}>
        {safePage > 1 ? (
          <Link className={ADMIN_PAGE_PAGER_BUTTON} href={buildHref({ qb_page: safePage - 1 })}>
            {t("common.previous")}
          </Link>
        ) : (
          <span className={ADMIN_PAGE_PAGER_DISABLED}>{t("common.previous")}</span>
        )}
        <span className={ADMIN_PAGE_PAGER_CURRENT}>
          {safePage}/{totalPages}
        </span>
        {safePage < totalPages ? (
          <Link className={ADMIN_PAGE_PAGER_BUTTON} href={buildHref({ qb_page: safePage + 1 })}>
            {t("common.next")}
          </Link>
        ) : (
          <span className={ADMIN_PAGE_PAGER_DISABLED}>{t("common.next")}</span>
        )}
      </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { ZohoTransfersClient } from "@/components/admin/ZohoTransfersClient";
import { db } from "@/lib/db";
import { ensureZohoBookingColumns } from "@/lib/zoho-bookings";
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

export default async function AdminZohoPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ zoho_status?: string; zoho_page?: string; page_size?: string }>;
}) {
  const { locale } = await params;
  const { zoho_status, zoho_page, page_size } = await searchParams;
  const t = await getTranslations();
  await requireAdminSection(locale, "zoho");
  if ((await getInvoiceProvider()) !== "ZOHO") {
    redirect(`/${locale}/admin/bookings`);
  }
  await ensureZohoBookingColumns();

  const requestedStatus =
    zoho_status === "all"
      ? null
      : zoho_status === "completed" || zoho_status === "failed" || zoho_status === "pending"
        ? zoho_status.toUpperCase()
        : "PENDING";
  const currentStatusParam = requestedStatus ? requestedStatus.toLowerCase() : "all";
  const pageSize = toPageSize(page_size);
  const page = toPositiveInt(zoho_page);

  const totalRowsResult = await db.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "Booking"
    WHERE "billingDocumentType" IS NOT NULL
      AND (${requestedStatus}::text IS NULL OR "zohoTransferStatus"::text = ${requestedStatus})
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
      "zohoTransferStatus",
      "zohoDocumentType",
      "zohoLastError",
      "zohoSyncRequestedAt",
      "zohoSyncedAt",
      "paymentReceivedAt"
    FROM "Booking"
    WHERE "billingDocumentType" IS NOT NULL
      AND (${requestedStatus}::text IS NULL OR "zohoTransferStatus"::text = ${requestedStatus})
    ORDER BY
      CASE
        WHEN "zohoTransferStatus" = 'FAILED'::"ZohoTransferStatus" THEN 0
        WHEN "zohoTransferStatus" = 'PENDING'::"ZohoTransferStatus" THEN 1
        WHEN "zohoTransferStatus" = 'COMPLETED'::"ZohoTransferStatus" THEN 2
        ELSE 3
      END,
      COALESCE("zohoSyncRequestedAt", "createdAt") DESC
    OFFSET ${(safePage - 1) * pageSize}
    LIMIT ${pageSize}
  `;

  const buildHref = (updates: Record<string, string | number | undefined>) => {
    const qp = new URLSearchParams();
    qp.set("zoho_status", currentStatusParam);
    qp.set("zoho_page", String(safePage));
    qp.set("page_size", String(pageSize));
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") qp.delete(key);
      else qp.set(key, String(value));
    });
    return `/${locale}/admin/zoho?${qp.toString()}`;
  };

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_PAGE_STACK}>
        <div>
          <p className={ADMIN_PAGE_KICKER}>{t("admin.zoho.title")}</p>
          <p className={`mt-2 ${ADMIN_PAGE_META_TEXT}`}>
            {t("admin.zoho.pageDescription")}
          </p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          <Link href={`/${locale}/admin/zoho?zoho_status=all&zoho_page=1&page_size=${pageSize}`} className={`${ADMIN_PAGE_ROWS_BUTTON} ${requestedStatus === null ? ADMIN_PAGE_ROWS_BUTTON_ACTIVE : ADMIN_PAGE_ROWS_BUTTON_IDLE}`}>
            {t("admin.zoho.filters.all")}
          </Link>
          <Link href={`/${locale}/admin/zoho?zoho_status=pending&zoho_page=1&page_size=${pageSize}`} className={`${ADMIN_PAGE_ROWS_BUTTON} ${requestedStatus === "PENDING" ? ADMIN_PAGE_ROWS_BUTTON_ACTIVE : ADMIN_PAGE_ROWS_BUTTON_IDLE}`}>
            {t("common.pending")}
          </Link>
          <Link href={`/${locale}/admin/zoho?zoho_status=failed&zoho_page=1&page_size=${pageSize}`} className={`${ADMIN_PAGE_ROWS_BUTTON} ${requestedStatus === "FAILED" ? ADMIN_PAGE_ROWS_BUTTON_ACTIVE : ADMIN_PAGE_ROWS_BUTTON_IDLE}`}>
            {t("admin.zoho.filters.failed")}
          </Link>
          <Link href={`/${locale}/admin/zoho?zoho_status=completed&zoho_page=1&page_size=${pageSize}`} className={`${ADMIN_PAGE_ROWS_BUTTON} ${requestedStatus === "COMPLETED" ? ADMIN_PAGE_ROWS_BUTTON_ACTIVE : ADMIN_PAGE_ROWS_BUTTON_IDLE}`}>
            {t("admin.zoho.filters.completed")}
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
                href={buildHref({ page_size: size, zoho_page: 1 })}
              >
                {size}
              </Link>
            ))}
          </div>
        </div>

        <ZohoTransfersClient rows={rows} locale={locale} />

        <div className={ADMIN_PAGE_PAGER}>
          {safePage > 1 ? (
            <Link className={ADMIN_PAGE_PAGER_BUTTON} href={buildHref({ zoho_page: safePage - 1 })}>
              {t("common.previous")}
            </Link>
          ) : (
            <span className={ADMIN_PAGE_PAGER_DISABLED}>{t("common.previous")}</span>
          )}
          <span className={ADMIN_PAGE_PAGER_CURRENT}>
            {safePage}/{totalPages}
          </span>
          {safePage < totalPages ? (
            <Link className={ADMIN_PAGE_PAGER_BUTTON} href={buildHref({ zoho_page: safePage + 1 })}>
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

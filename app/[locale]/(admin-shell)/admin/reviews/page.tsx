import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { ReviewsTable } from "@/components/admin/ReviewsTable";
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

export default async function AdminReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ reviews_page?: string; page_size?: string }>;
}) {
  const { locale } = await params;
  const { reviews_page, page_size } = await searchParams;
  const t = await getTranslations();
  await requireAdminSection(locale, "reviews");
  const pageSize = toPageSize(page_size);
  const page = toPositiveInt(reviews_page);
  const [total, rows] = await Promise.all([
    db.review.count(),
    db.review.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
  ]);
  const buildHref = (updates: Record<string, string | number | undefined>) => {
    const qp = new URLSearchParams();
    qp.set("page_size", String(pageSize));
    if (reviews_page) qp.set("reviews_page", reviews_page);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") qp.delete(k);
      else qp.set(k, String(v));
    });
    return `/${locale}/admin/reviews?${qp.toString()}`;
  };
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const startRow = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endRow = Math.min(total, safePage * pageSize);
  const prevLabel = t("common.previous");
  const nextLabel = t("common.next");
  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_PAGE_STACK}>
      <p className={ADMIN_PAGE_KICKER}>{t("admin.dashboard.reviews.title")}</p>
      <p className={ADMIN_PAGE_META_TEXT}>{t("admin.dashboard.reviews.subtitle")}</p>
      <div className={ADMIN_PAGE_META_ROW}>
        <div className={ADMIN_PAGE_META_TEXT}>Showing {startRow}-{endRow} of {total}</div>
        <div className={ADMIN_PAGE_ROWS_WRAP}>
          <span className={ADMIN_PAGE_META_TEXT}>Rows:</span>
          {ADMIN_PAGE_SIZE_OPTIONS.map((size) => (
            <Link key={size} className={`${ADMIN_PAGE_ROWS_BUTTON} ${pageSize === size ? ADMIN_PAGE_ROWS_BUTTON_ACTIVE : ADMIN_PAGE_ROWS_BUTTON_IDLE}`} href={buildHref({ page_size: size, reviews_page: 1 })}>
              {size}
            </Link>
          ))}
        </div>
      </div>
      <ReviewsTable reviews={rows as any[]} locale={locale} />
      <div className={ADMIN_PAGE_PAGER}>
        {safePage > 1 ? (
          <Link className={ADMIN_PAGE_PAGER_BUTTON} href={buildHref({ reviews_page: safePage - 1 })}>
            {prevLabel}
          </Link>
        ) : (
          <span className={ADMIN_PAGE_PAGER_DISABLED}>{prevLabel}</span>
        )}
        <span className={ADMIN_PAGE_PAGER_CURRENT}>
          {safePage}/{totalPages}
        </span>
        {safePage < totalPages ? (
          <Link className={ADMIN_PAGE_PAGER_BUTTON} href={buildHref({ reviews_page: safePage + 1 })}>
            {nextLabel}
          </Link>
        ) : (
          <span className={ADMIN_PAGE_PAGER_DISABLED}>{nextLabel}</span>
        )}
      </div>
      </div>
    </div>
  );
}

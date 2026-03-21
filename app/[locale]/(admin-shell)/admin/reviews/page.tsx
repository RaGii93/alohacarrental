import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { ReviewsTable } from "@/components/admin/ReviewsTable";
import { ADMIN_PAGE_SIZE_OPTIONS, requireAdminSection, toPageSize, toPositiveInt } from "@/app/[locale]/admin/_lib";

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
    <div className="w-full px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="text-xl font-semibold">{t("admin.dashboard.reviews.title")}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{t("admin.dashboard.reviews.subtitle")}</p>
      <div className="mb-3 flex flex-col gap-2 text-sm md:flex-row md:items-center md:justify-between">
        <div className="text-muted-foreground">Showing {startRow}-{endRow} of {total}</div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Rows:</span>
          {ADMIN_PAGE_SIZE_OPTIONS.map((size) => (
            <Link key={size} className={`inline-flex h-8 items-center rounded-md border px-2 text-xs ${pageSize === size ? "bg-accent font-medium" : "hover:bg-accent"}`} href={buildHref({ page_size: size, reviews_page: 1 })}>
              {size}
            </Link>
          ))}
        </div>
      </div>
      <ReviewsTable reviews={rows as any[]} locale={locale} />
      <div className="mt-4 flex items-center justify-end gap-2">
        {safePage > 1 ? (
          <Link className="inline-flex h-8 items-center rounded-md border px-3 text-xs hover:bg-accent" href={buildHref({ reviews_page: safePage - 1 })}>
            {prevLabel}
          </Link>
        ) : (
          <span className="inline-flex h-8 items-center rounded-md border px-3 text-xs opacity-50">{prevLabel}</span>
        )}
        <span className="inline-flex h-8 items-center rounded-md border px-2 text-xs">
          {safePage}/{totalPages}
        </span>
        {safePage < totalPages ? (
          <Link className="inline-flex h-8 items-center rounded-md border px-3 text-xs hover:bg-accent" href={buildHref({ reviews_page: safePage + 1 })}>
            {nextLabel}
          </Link>
        ) : (
          <span className="inline-flex h-8 items-center rounded-md border px-3 text-xs opacity-50">{nextLabel}</span>
        )}
      </div>
    </div>
  );
}

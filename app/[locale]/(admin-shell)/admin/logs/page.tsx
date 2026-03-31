import Link from "next/link";
import { Prisma, Role } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { Activity, CalendarClock, Filter, ListFilter, Search, ShieldCheck, UserRound } from "lucide-react";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/datetime";
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

const ROLE_OPTIONS = [Role.ROOT, Role.OWNER, Role.STAFF] as const;

function toRole(value: string | undefined) {
  return ROLE_OPTIONS.includes(value as Role) ? (value as Role) : undefined;
}

function formatActionLabel(action: string) {
  return action
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function AdminLogsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    logs_page?: string;
    page_size?: string;
    q?: string;
    role?: string;
    action?: string;
  }>;
}) {
  const { locale } = await params;
  const { logs_page, page_size, q, role, action } = await searchParams;
  const t = await getTranslations();
  await requireAdminSection(locale, "logs");

  const pageSize = toPageSize(page_size);
  const page = toPositiveInt(logs_page);
  const query = q?.trim() || "";
  const roleFilter = toRole(role);
  const actionFilter = action?.trim() || "";

  const where: Prisma.AuditLogWhereInput = {
    ...(roleFilter ? { adminUser: { role: roleFilter } } : {}),
    ...(actionFilter ? { action: actionFilter } : {}),
    ...(query
      ? {
          OR: [
            { action: { contains: query, mode: "insensitive" } },
            { adminUser: { email: { contains: query, mode: "insensitive" } } },
            { booking: { bookingCode: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [total, rows, actionOptions, totalToday, linkedBookings] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      include: {
        adminUser: { select: { email: true, role: true } },
        booking: { select: { bookingCode: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.auditLog.findMany({
      select: { action: true },
      distinct: ["action"],
      orderBy: { action: "asc" },
    }),
    db.auditLog.count({ where: { createdAt: { gte: since24h } } }),
    db.auditLog.count({ where: { bookingId: { not: null } } }),
  ]);

  const buildHref = (updates: Record<string, string | number | undefined>) => {
    const qp = new URLSearchParams();
    qp.set("page_size", String(pageSize));
    if (query) qp.set("q", query);
    if (roleFilter) qp.set("role", roleFilter);
    if (actionFilter) qp.set("action", actionFilter);
    if (logs_page) qp.set("logs_page", logs_page);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") qp.delete(k);
      else qp.set(k, String(v));
    });
    return `/${locale}/admin/logs?${qp.toString()}`;
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const startRow = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endRow = Math.min(total, safePage * pageSize);
  const prevLabel = t("common.previous");
  const nextLabel = t("common.next");
  const hasFilters = Boolean(query || roleFilter || actionFilter);
  const roleLabel = (value: Role) =>
    value === "ROOT" ? t("admin.logs.roles.root") : value === "OWNER" ? t("admin.logs.roles.owner") : t("admin.logs.roles.staff");

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_PAGE_STACK}>
        <section className="overflow-hidden rounded-[2rem] border border-[hsl(var(--border))] bg-[linear-gradient(135deg,#ffffff_0%,hsl(var(--accent)/0.22)_42%,hsl(var(--primary)/0.08)_100%)] shadow-[0_30px_80px_-48px_hsl(var(--primary)/0.2)]">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.5fr_1fr] lg:p-8">
            <div>
              <p className={ADMIN_PAGE_KICKER}>{t("admin.logs.page.kicker")}</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{t("admin.logs.page.title")}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                {t("admin.logs.page.description")}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700">
                  <Search className="h-4 w-4 text-[hsl(var(--primary))]" />
                  {t("admin.logs.page.searchHint")}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-700">
                  <Filter className="h-4 w-4 text-[hsl(var(--primary))]" />
                  {t("admin.logs.page.filterHint")}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <Card className="rounded-2xl border-0 bg-slate-950 p-4 text-white shadow-[0_20px_45px_-28px_rgba(15,23,42,0.9)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">{t("admin.logs.cards.filtered")}</span>
                  <Activity className="h-4 w-4 text-[hsl(var(--accent))]" />
                </div>
                <p className="mt-4 text-3xl font-black">{total}</p>
                <p className="mt-1 text-xs text-white/60">{t("admin.logs.cards.matchingEvents")}</p>
              </Card>
              <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.35)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t("admin.logs.cards.activity24h")}</span>
                  <CalendarClock className="h-4 w-4 text-[hsl(var(--primary))]" />
                </div>
                <p className="mt-4 text-3xl font-black text-slate-950">{totalToday}</p>
                <p className="mt-1 text-xs text-slate-500">{t("admin.logs.cards.eventsToday")}</p>
              </Card>
              <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.35)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t("admin.logs.cards.bookingLinked")}</span>
                  <ShieldCheck className="h-4 w-4 text-[hsl(var(--primary))]" />
                </div>
                <p className="mt-4 text-3xl font-black text-slate-950">{linkedBookings}</p>
                <p className="mt-1 text-xs text-slate-500">{t("admin.logs.cards.linkedDescription")}</p>
              </Card>
            </div>
          </div>
        </section>

        <Card className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.35)] sm:p-6">
          <form className="grid gap-3 lg:grid-cols-[1.6fr_0.8fr_1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                name="q"
                defaultValue={query}
                placeholder={t("admin.logs.filters.searchPlaceholder")}
                className="h-11 rounded-2xl border-slate-200 pl-10"
              />
            </div>
            <select
              name="role"
              defaultValue={roleFilter || ""}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-[0_10px_24px_-18px_rgba(12,74,160,0.2)] outline-none focus:ring-2 focus:ring-[hsl(var(--ring))/0.25]"
            >
              <option value="">{t("admin.logs.filters.allRoles")}</option>
              {ROLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {roleLabel(option)}
                </option>
              ))}
            </select>
            <select
              name="action"
              defaultValue={actionFilter}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-[0_10px_24px_-18px_rgba(12,74,160,0.2)] outline-none focus:ring-2 focus:ring-[hsl(var(--ring))/0.25]"
            >
              <option value="">{t("admin.logs.filters.allActions")}</option>
              {actionOptions.map((option) => (
                <option key={option.action} value={option.action}>
                  {formatActionLabel(option.action)}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input type="hidden" name="page_size" value={pageSize} />
              <Button type="submit" className="h-11 rounded-2xl px-5">
                <ListFilter className="h-4 w-4" />
                {t("admin.logs.filters.apply")}
              </Button>
              {hasFilters ? (
                <Button asChild variant="outline" className="h-11 rounded-2xl px-4">
                  <Link href={buildHref({ q: undefined, role: undefined, action: undefined, logs_page: 1 })}>{t("admin.logs.filters.clear")}</Link>
                </Button>
              ) : null}
            </div>
          </form>

          {hasFilters ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {query ? (
                <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  {t("admin.logs.pills.search", { value: query })}
                </span>
              ) : null}
              {roleFilter ? (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                  {t("admin.logs.pills.role", { value: roleLabel(roleFilter) })}
                </span>
              ) : null}
              {actionFilter ? (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                  {t("admin.logs.pills.action", { value: formatActionLabel(actionFilter) })}
                </span>
              ) : null}
            </div>
          ) : null}
        </Card>

        <div className={ADMIN_PAGE_META_ROW}>
          <div className={ADMIN_PAGE_META_TEXT}>{t("admin.logs.meta.showing", { start: startRow, end: endRow, total })}</div>
          <div className={ADMIN_PAGE_ROWS_WRAP}>
            <span className={ADMIN_PAGE_META_TEXT}>{t("admin.logs.meta.rows")}</span>
            {ADMIN_PAGE_SIZE_OPTIONS.map((size) => (
              <Link
                key={size}
                className={`${ADMIN_PAGE_ROWS_BUTTON} ${pageSize === size ? ADMIN_PAGE_ROWS_BUTTON_ACTIVE : ADMIN_PAGE_ROWS_BUTTON_IDLE}`}
                href={buildHref({ page_size: size, logs_page: 1 })}
              >
                {size}
              </Link>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_24px_70px_-46px_rgba(15,23,42,0.38)]">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Search className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-lg font-bold text-slate-900">{t("admin.logs.empty.title")}</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {t("admin.logs.empty.description")}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {rows.map((entry) => (
                <div key={entry.id} className="grid gap-4 px-5 py-5 transition-colors hover:bg-slate-50/80 md:grid-cols-[1fr_auto] md:px-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white">
                        {formatActionLabel(entry.action)}
                      </span>
                      {entry.booking?.bookingCode ? (
                        <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                          {t("admin.logs.entry.booking", { code: entry.booking.bookingCode })}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {roleLabel(entry.adminUser.role)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <UserRound className="h-4 w-4 text-slate-400" />
                        {entry.adminUser.email}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-slate-400" />
                        {formatDateTime(entry.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start justify-end">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t("admin.logs.entry.logId")}</p>
                      <p className="mt-1 max-w-[220px] truncate text-xs font-medium text-slate-600">{entry.id}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className={ADMIN_PAGE_PAGER}>
          {safePage > 1 ? (
            <Link className={ADMIN_PAGE_PAGER_BUTTON} href={buildHref({ logs_page: safePage - 1 })}>
              {prevLabel}
            </Link>
          ) : (
            <span className={ADMIN_PAGE_PAGER_DISABLED}>{prevLabel}</span>
          )}
          <span className={ADMIN_PAGE_PAGER_CURRENT}>
            {safePage}/{totalPages}
          </span>
          {safePage < totalPages ? (
            <Link className={ADMIN_PAGE_PAGER_BUTTON} href={buildHref({ logs_page: safePage + 1 })}>
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

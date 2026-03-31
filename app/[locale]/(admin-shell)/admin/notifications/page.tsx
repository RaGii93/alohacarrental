import type { Metadata } from "next";
import { Bell, Trash2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/seo";
import { getTenantConfig } from "@/lib/tenant";
import {
  ADMIN_PAGE_KICKER,
  ADMIN_PAGE_SHELL,
  ADMIN_PAGE_STACK,
  requireAdminSection,
} from "@/app/[locale]/admin/_lib";
import { NotificationCenterClient } from "@/components/admin/NotificationCenterClient";
import { Card } from "@/components/ui/card";
import { listNotifications, NOTIFICATION_RETENTION_DAYS } from "@/lib/notifications";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tenant = await getTenantConfig();
  const t = await getTranslations({ locale });

  return buildMetadata({
    locale,
    path: "/admin/notifications",
    title: `${t("admin.dashboard.tabs.notifications")} | ${tenant.tenantName}`,
    noIndex: true,
    tenant,
  });
}

export default async function AdminNotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdminSection(locale, "notifications");
  const t = await getTranslations();
  const notifications = await listNotifications();

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_PAGE_STACK}>
        <div className="overflow-hidden rounded-[2rem] border border-[hsl(var(--border))] bg-[linear-gradient(135deg,#ffffff,#f6f9ff_45%,#eef6ff)] p-8 shadow-[0_28px_72px_-40px_hsl(215_28%_17%/0.14)]">
          <p className={ADMIN_PAGE_KICKER}>
            {t.has("admin.dashboard.tabs.notifications" as any)
              ? t("admin.dashboard.tabs.notifications" as any)
              : "Notifications"}
          </p>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
                <Bell className="size-4" />
                {t("admin.notifications.center.title")}
              </div>
              <h1 className="text-4xl font-black tracking-[-0.04em] text-[hsl(var(--foreground))]">
                {t("admin.notifications.page.title")}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-[hsl(var(--foreground)/0.72)]">
                {t("admin.notifications.page.description", { days: NOTIFICATION_RETENTION_DAYS })}
              </p>
            </div>

            <Card className="rounded-[1.6rem] border-slate-200 bg-white/90 p-5 shadow-none">
              <div className="flex items-start gap-3">
                <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <Trash2 className="size-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{t("admin.notifications.page.cleanupTitle")}</p>
                  <p className="text-sm leading-6 text-slate-600">
                    {t("admin.notifications.page.cleanupDescription")}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <NotificationCenterClient locale={locale} notifications={notifications} />
      </div>
    </div>
  );
}

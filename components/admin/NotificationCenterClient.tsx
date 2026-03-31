"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Bell, CheckCheck, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { dismissNotificationAction } from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  severity: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  createdAt: Date | string;
};

function severityStyles(severity: NotificationRow["severity"]) {
  switch (severity) {
    case "SUCCESS":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "WARNING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "ERROR":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-sky-200 bg-sky-50 text-sky-700";
  }
}

export function NotificationCenterClient({
  locale,
  notifications: initialNotifications,
  compact = false,
}: {
  locale: string;
  notifications: NotificationRow[];
  compact?: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isPending, startTransition] = useTransition();

  const getSeverityLabel = (severity: NotificationRow["severity"]) => {
    switch (severity) {
      case "SUCCESS":
        return t("common.success");
      case "WARNING":
        return t("common.warning");
      case "ERROR":
        return t("common.error");
      default:
        return t("common.info");
    }
  };

  const dismiss = (notificationId: string) => {
    startTransition(async () => {
      const result = await dismissNotificationAction(notificationId, locale);
      if (!result.success) {
        toast.error(result.error || t("admin.notifications.messages.dismissFailed"));
        return;
      }
      setNotifications((current) => current.filter((item) => item.id !== notificationId));
      toast.success(t("admin.notifications.messages.dismissed"));
      router.refresh();
    });
  };

  if (compact) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative h-11 rounded-xl">
            <Bell className="h-4 w-4" />
            <span className="sr-only">{t("admin.dashboard.tabs.notifications")}</span>
            {notifications.length > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {notifications.length}
              </span>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[380px] rounded-2xl p-3">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div>
              <p className="text-sm font-semibold text-slate-900">{t("admin.notifications.center.title")}</p>
              <p className="text-xs text-slate-500">{t("admin.notifications.center.subtitle")}</p>
            </div>
            <Link href={`/${locale}/admin/notifications`} className="text-xs font-semibold text-sky-700 hover:underline">
              {t("admin.notifications.actions.viewAll")}
            </Link>
          </div>
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <div className="admin-surface-soft rounded-xl border border-dashed border-slate-200/70 px-3 py-6 text-center text-sm text-slate-500">
                {t("admin.notifications.empty.compact")}
              </div>
            ) : (
              notifications.slice(0, 6).map((notification) => (
                <div key={notification.id} className="admin-surface-soft rounded-xl border-transparent p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${severityStyles(notification.severity)}`}>
                        {getSeverityLabel(notification.severity)}
                      </span>
                      <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                      <p className="text-xs leading-5 text-slate-600">{notification.message}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => dismiss(notification.id)}
                      disabled={isPending}
                      className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">{t("admin.notifications.actions.dismiss")}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.length === 0 ? (
        <Card className="admin-surface rounded-[1.5rem] border-dashed border-slate-200/70 p-10 text-center text-sm text-slate-500">
          {t("admin.notifications.empty.page")}
        </Card>
      ) : (
        notifications.map((notification) => (
          <Card key={notification.id} className="admin-surface rounded-[1.5rem] border-transparent p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${severityStyles(notification.severity)}`}>
                    {getSeverityLabel(notification.severity)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{notification.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{notification.message}</p>
                </div>
                {notification.href ? (
                  <Link href={notification.href} className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:underline">
                    {t("admin.notifications.actions.openRelated")}
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
              <Button variant="outline" onClick={() => dismiss(notification.id)} disabled={isPending} className="admin-outline-button rounded-xl border-transparent">
                <CheckCheck className="h-4 w-4" />
                {t("admin.notifications.actions.dismiss")}
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

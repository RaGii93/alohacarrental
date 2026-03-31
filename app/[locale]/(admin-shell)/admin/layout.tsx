import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/seo";
import { getTenantConfig } from "@/lib/tenant";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { requireAdmin } from "@/lib/auth-guards";
import { isLicenseActive } from "@/lib/license";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { getInvoiceProvider } from "@/lib/settings";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { listNotifications } from "@/lib/notifications";
import { NotificationCenterClient } from "@/components/admin/NotificationCenterClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tenant = await getTenantConfig();
  return buildMetadata({
    locale,
    path: "/admin",
    title: `Admin | ${tenant.tenantName}`,
    noIndex: true,
    tenant,
  });
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const admin = await requireAdmin(locale);
  const invoiceProvider = await getInvoiceProvider();
  const notifications = await listNotifications({ limit: 8 });
  const licenseActive = isLicenseActive();
  if (!licenseActive && admin.role !== "ROOT") {
    redirect(`/${locale}/admin/billing-required`);
  }
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "18rem",
          "--header-height": "3.75rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        userEmail={admin.email}
        role={admin.role}
        licenseActive={licenseActive}
        invoiceProvider={invoiceProvider}
        variant="inset"
      />
      <SidebarInset className="min-w-0 bg-[hsl(220_33%_98%)]">
        <header className="shrink-0 border-b border-[hsl(214_32%_92%)] px-4 py-4 lg:px-6">
          <div className="flex w-full flex-col gap-4 rounded-2xl bg-white px-4 py-4 shadow-[0_16px_34px_-24px_hsl(215_28%_17%/0.12)] ring-1 ring-[hsl(215_25%_27%/0.04)] md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="h-10 w-10 rounded-xl border border-[hsl(214_32%_88%)] bg-[hsl(220_33%_98%)] text-[hsl(var(--foreground))] shadow-sm hover:bg-[hsl(214_60%_97%)]" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                    {t("nav.admin")}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] md:hidden">
                    Navigation
                  </p>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[hsl(var(--foreground))] md:text-[15px]">
                  {t("admin.dashboard.header.welcome", { user: admin.email })}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[hsl(var(--secondary))] px-2 py-0.5 text-[11px] font-medium text-[hsl(var(--secondary-foreground))]">
                    {t("admin.dashboard.header.role", { role: admin.role })}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      licenseActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {licenseActive
                      ? t("admin.dashboard.header.licenseActive")
                      : t("admin.dashboard.header.licenseSuspended")}
                  </span>
                </div>
              </div>
            </div>
            <form action={logoutAction.bind(null, locale)} className="w-full shrink-0 md:w-auto">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:justify-end">
                <NotificationCenterClient locale={locale} notifications={notifications} compact />
                <LanguageSwitcher />
                <Button type="submit" variant="outline" size="sm" className="h-11 w-full rounded-xl sm:w-auto">
                  {t("nav.logout")}
                </Button>
              </div>
            </form>
          </div>
        </header>
        <div className="@container/main flex flex-1 flex-col">
          <main className="min-w-0 flex flex-1 flex-col">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tenant = getTenantConfig();
  return buildMetadata({
    locale,
    path: "/admin",
    title: `Admin | ${tenant.tenantName}`,
    noIndex: true,
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
  const licenseActive = isLicenseActive();
  if (!licenseActive && admin.role !== "ROOT") {
    redirect(`/${locale}/admin/billing-required`);
  }
  return (
    <SidebarProvider>
      <AppSidebar userEmail={admin.email} role={admin.role} licenseActive={licenseActive} />
      <SidebarInset>
        <header className="sticky top-16 z-10 flex min-h-12 flex-wrap items-center justify-between gap-2 border-b bg-background/90 px-4 py-2 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {t("admin.dashboard.header.welcome", { user: admin.email })}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {t("admin.dashboard.header.role", { role: admin.role })} |{" "}
                {licenseActive
                  ? t("admin.dashboard.header.licenseActive")
                  : t("admin.dashboard.header.licenseSuspended")}
              </p>
            </div>
          </div>
          <form action={logoutAction.bind(null, locale)}>
            <Button type="submit" variant="outline" size="sm">
              {t("nav.logout")}
            </Button>
          </form>
        </header>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

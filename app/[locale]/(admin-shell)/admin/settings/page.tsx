import { getTranslations } from "next-intl/server";
import { TaxSettingsCard } from "@/components/admin/TaxSettingsCard";
import {
  getInvoiceProvider,
  getMinBookingDays,
  getQuickBooksFeatureSettings,
  getQuickBooksSetupSettings,
  getTaxPercentage,
  getTenantSettings,
  getVehicleRatesIncludeTax,
  getZohoInvoiceFeatureSettings,
  getZohoInvoiceOrganizationId,
  getZohoSetupSettings,
} from "@/lib/settings";
import { ADMIN_PAGE_KICKER, ADMIN_PAGE_SHELL, ADMIN_PAGE_STACK, requireAdminSection } from "@/app/[locale]/admin/_lib";

export default async function AdminSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ integration?: string; status?: string; message?: string }>;
}) {
  const { locale } = await params;
  const { integration, status, message } = await searchParams;
  const t = await getTranslations();
  await requireAdminSection(locale, "settings");
  const [taxPercentage, minimumBookingDays, tenant, quickBooks, quickBooksSetup, vehicleRatesIncludeTax, invoiceProvider, zoho, zohoOrganizationId, zohoSetup] = await Promise.all([
    getTaxPercentage(),
    getMinBookingDays(),
    getTenantSettings(),
    getQuickBooksFeatureSettings(),
    getQuickBooksSetupSettings(),
    getVehicleRatesIncludeTax(),
    getInvoiceProvider(),
    getZohoInvoiceFeatureSettings(),
    getZohoInvoiceOrganizationId(),
    getZohoSetupSettings(),
  ]);
  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_PAGE_STACK}>
      <p className={ADMIN_PAGE_KICKER}>{t("admin.dashboard.tabs.settings")}</p>
      <TaxSettingsCard
        locale={locale}
        initialTaxPercentage={taxPercentage}
        initialVehicleRatesIncludeTax={vehicleRatesIncludeTax}
        initialMinimumBookingDays={minimumBookingDays}
        initialTenant={tenant}
        initialQuickBooks={quickBooks}
        initialQuickBooksSetup={quickBooksSetup}
        initialInvoiceProvider={invoiceProvider}
        initialZohoConfigured={zoho}
        initialZohoOrganizationId={zohoOrganizationId}
        initialZohoSetup={zohoSetup}
        integrationFeedback={
          integration && status
            ? {
                provider: integration,
                status,
                message: message || "",
              }
            : null
        }
      />
      </div>
    </div>
  );
}

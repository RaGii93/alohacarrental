"use server";

import { getSession } from "@/lib/session";
import {
  getMinBookingDays,
  getInvoiceProvider,
  getQuickBooksFeatureSettings,
  getQuickBooksSetupSettings,
  getTenantSettings,
  getVehicleRatesIncludeTax,
  getZohoInvoiceFeatureSettings,
  getZohoInvoiceOrganizationId,
  getZohoSetupSettings,
  setQuickBooksFeatureSettings,
  setQuickBooksSetupSettings,
  setTenantSettings,
  setInvoiceProvider,
  getTaxPercentage,
  setMinBookingDays,
  setTaxPercentage,
  setVehicleRatesIncludeTax,
  setZohoInvoiceOrganizationId,
  setZohoInvoiceRefreshToken,
  setZohoSetupSettings,
} from "@/lib/settings";
import { logAdminAction } from "@/lib/audit";

async function requireSettingsAdmin() {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Unauthorized" };
  if (session.role !== "ROOT" && session.role !== "OWNER") {
    return { ok: false as const, error: "Forbidden" };
  }
  return { ok: true as const, session };
}

export async function getTaxSettingsAction() {
  try {
    const [taxPercentage, vehicleRatesIncludeTax] = await Promise.all([
      getTaxPercentage(),
      getVehicleRatesIncludeTax(),
    ]);
    return { success: true as const, taxPercentage, vehicleRatesIncludeTax };
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to load tax settings" };
  }
}

export async function updateTaxPercentageAction(taxPercentage: number, _locale: string) {
  try {
    const auth = await requireSettingsAdmin();
    if (!auth.ok) return { success: false as const, error: auth.error };

    const value = await setTaxPercentage(taxPercentage);
    await logAdminAction({
      adminUserId: auth.session.adminUserId,
      action: "SETTINGS_TAX_UPDATED",
    });
    return { success: true as const, taxPercentage: value };
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to update tax percentage" };
  }
}

export async function updateVehicleRatesIncludeTaxAction(vehicleRatesIncludeTax: boolean, _locale: string) {
  try {
    const auth = await requireSettingsAdmin();
    if (!auth.ok) return { success: false as const, error: auth.error };

    const value = await setVehicleRatesIncludeTax(vehicleRatesIncludeTax);
    await logAdminAction({
      adminUserId: auth.session.adminUserId,
      action: "SETTINGS_VEHICLE_TAX_MODE_UPDATED",
    });
    return { success: true as const, vehicleRatesIncludeTax: value };
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to update vehicle tax mode" };
  }
}

export async function getSystemSettingsAction() {
  try {
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
    return {
      success: true as const,
      taxPercentage,
      minimumBookingDays,
      tenant,
      quickBooks,
      quickBooksSetup,
      vehicleRatesIncludeTax,
      invoiceProvider,
      zoho,
      zohoOrganizationId,
      zohoSetup,
    };
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to load settings" };
  }
}

export async function updateMinimumBookingDaysAction(minimumBookingDays: number, _locale: string) {
  try {
    const auth = await requireSettingsAdmin();
    if (!auth.ok) return { success: false as const, error: auth.error };

    const value = await setMinBookingDays(minimumBookingDays);
    await logAdminAction({
      adminUserId: auth.session.adminUserId,
      action: "SETTINGS_MIN_BOOKING_DAYS_UPDATED",
    });
    return { success: true as const, minimumBookingDays: value };
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to update minimum booking days" };
  }
}

export async function updateSaasSettingsAction(
  input: {
    tenantName: string;
    logoUrl: string;
    phone: string;
    whatsapp: string;
    whatsappUrl?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    linkedinUrl?: string;
    tiktokUrl?: string;
    email: string;
    address: string;
    currency: string;
    paymentInstructions: string;
    termsPdfUrl: string;
    themePrimary: string;
    themePrimaryForeground: string;
    themeAccent: string;
    themeAccentForeground: string;
    themeRing: string;
    themeSidebarPrimary: string;
    themeSidebarPrimaryForeground: string;
    themeSidebarAccent: string;
    themeSidebarAccentForeground: string;
    invoiceProvider: "NONE" | "QUICKBOOKS" | "ZOHO";
    quickBooksEnabled: boolean;
    quickBooksVisible: boolean;
    quickBooksClientId: string;
    quickBooksClientSecret: string;
    quickBooksRedirectUri: string;
    quickBooksEnvironment: "production" | "sandbox";
    quickBooksItemId: string;
    zohoOrganizationId: string;
    zohoRefreshToken: string;
    zohoClientId: string;
    zohoClientSecret: string;
    zohoRedirectUri: string;
    zohoAccountsBaseUrl: string;
    zohoApiBaseUrl: string;
  },
  _locale: string
) {
  try {
    const auth = await requireSettingsAdmin();
    if (!auth.ok) return { success: false as const, error: auth.error };

    const [tenant, quickBooks, quickBooksSetup, invoiceProvider, zoho] = await Promise.all([
      setTenantSettings({
        tenantName: input.tenantName.trim(),
        logoUrl: input.logoUrl.trim(),
        phone: input.phone.trim(),
        whatsapp: input.whatsapp.trim(),
        whatsappUrl: input.whatsappUrl?.trim() || undefined,
        facebookUrl: input.facebookUrl?.trim() || undefined,
        instagramUrl: input.instagramUrl?.trim() || undefined,
        linkedinUrl: input.linkedinUrl?.trim() || undefined,
        tiktokUrl: input.tiktokUrl?.trim() || undefined,
        email: input.email.trim(),
        address: input.address.trim(),
        currency: input.currency.trim().toUpperCase(),
        paymentInstructions: input.paymentInstructions.trim(),
        termsPdfUrl: input.termsPdfUrl.trim(),
        theme: {
          primary: input.themePrimary.trim(),
          primaryForeground: input.themePrimaryForeground.trim(),
          accent: input.themeAccent.trim(),
          accentForeground: input.themeAccentForeground.trim(),
          ring: input.themeRing.trim(),
          sidebarPrimary: input.themeSidebarPrimary.trim(),
          sidebarPrimaryForeground: input.themeSidebarPrimaryForeground.trim(),
          sidebarAccent: input.themeSidebarAccent.trim(),
          sidebarAccentForeground: input.themeSidebarAccentForeground.trim(),
        },
      }),
      setQuickBooksFeatureSettings({
        dbEnabled: input.quickBooksEnabled,
        dbVisible: input.quickBooksVisible,
      }),
      setQuickBooksSetupSettings({
        clientId: input.quickBooksClientId,
        clientSecret: input.quickBooksClientSecret,
        redirectUri: input.quickBooksRedirectUri,
        environment: input.quickBooksEnvironment,
        itemId: input.quickBooksItemId,
      }),
      setInvoiceProvider(input.invoiceProvider),
      Promise.all([
        setZohoInvoiceOrganizationId(input.zohoOrganizationId),
        setZohoInvoiceRefreshToken(input.zohoRefreshToken),
        setZohoSetupSettings({
          clientId: input.zohoClientId,
          clientSecret: input.zohoClientSecret,
          redirectUri: input.zohoRedirectUri,
          accountsBaseUrl: input.zohoAccountsBaseUrl,
          apiBaseUrl: input.zohoApiBaseUrl,
          organizationId: input.zohoOrganizationId,
        }),
      ]).then(async () => ({
        feature: await getZohoInvoiceFeatureSettings(),
        setup: await getZohoSetupSettings(),
      })),
    ]);

    await logAdminAction({
      adminUserId: auth.session.adminUserId,
      action: "SETTINGS_SAAS_UPDATED",
    });

    return { success: true as const, tenant, quickBooks, quickBooksSetup, invoiceProvider, zoho: zoho.feature, zohoSetup: zoho.setup };
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to update SaaS settings" };
  }
}

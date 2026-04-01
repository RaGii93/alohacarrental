"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Banknote, Building2, CheckCircle2, Palette, PlugZap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  updateFleetOperationsSettingsAction,
  updateBookingRuleSettingsAction,
  updateBookingHoldDaysAction,
  updateMinimumBookingDaysAction,
  updateSaasSettingsAction,
  updateTaxPercentageAction,
  updateVehicleRatesIncludeTaxAction,
} from "@/actions/settings";
import type {
  BookingRuleSettings,
  BelowMinimumRentalSurchargeMode,
  FleetOperationsSettings,
  InvoiceProvider,
  QuickBooksFeatureSettings,
  QuickBooksSetupSettings,
  TenantSettings,
  ZohoInvoiceFeatureSettings,
  ZohoSetupSettings,
} from "@/lib/settings";

type Props = {
  locale: string;
  initialTaxPercentage: number;
  initialVehicleRatesIncludeTax: boolean;
  initialMinimumBookingDays: number;
  initialBookingHoldDays: number;
  initialBookingRules: BookingRuleSettings;
  initialFleetOperations: FleetOperationsSettings;
  initialTenant: TenantSettings;
  initialQuickBooks: QuickBooksFeatureSettings;
  initialQuickBooksSetup: QuickBooksSetupSettings;
  initialInvoiceProvider: InvoiceProvider;
  initialZohoConfigured: ZohoInvoiceFeatureSettings;
  initialZohoOrganizationId: string;
  initialZohoSetup: ZohoSetupSettings;
  integrationFeedback: {
    provider: string;
    status: string;
    message?: string;
  } | null;
};

type ProviderHealthState = {
  loading: boolean;
  summary?: string;
  error?: string;
  details?: string[];
};

export function TaxSettingsCard({
  locale,
  initialTaxPercentage,
  initialVehicleRatesIncludeTax,
  initialMinimumBookingDays,
  initialBookingHoldDays,
  initialBookingRules,
  initialFleetOperations,
  initialTenant,
  initialQuickBooks,
  initialQuickBooksSetup,
  initialInvoiceProvider,
  initialZohoConfigured,
  initialZohoOrganizationId,
  initialZohoSetup,
  integrationFeedback,
}: Props) {
  const browserBaseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const t = useTranslations();
  const router = useRouter();
  const [taxPercentage, setTaxPercentage] = useState(String(initialTaxPercentage));
  const [vehicleRatesIncludeTax, setVehicleRatesIncludeTax] = useState(initialVehicleRatesIncludeTax);
  const [minimumBookingDays, setMinimumBookingDays] = useState(String(initialMinimumBookingDays));
  const [bookingHoldDays, setBookingHoldDays] = useState(String(initialBookingHoldDays));
  const [belowMinimumRentalAdminOnly, setBelowMinimumRentalAdminOnly] = useState(initialBookingRules.belowMinimumRentalAdminOnly);
  const [belowMinimumRentalPricingEnabled, setBelowMinimumRentalPricingEnabled] = useState(initialBookingRules.belowMinimumRentalPricingEnabled);
  const [belowMinimumRentalSurchargeMode, setBelowMinimumRentalSurchargeMode] = useState<BelowMinimumRentalSurchargeMode>(initialBookingRules.belowMinimumRentalSurchargeMode);
  const [belowMinimumRentalSurchargeValue, setBelowMinimumRentalSurchargeValue] = useState(String(initialBookingRules.belowMinimumRentalSurchargeValue));
  const [lastMinuteBookingEnabled, setLastMinuteBookingEnabled] = useState(initialBookingRules.lastMinuteBookingEnabled);
  const [lastMinuteBookingAdminOnly, setLastMinuteBookingAdminOnly] = useState(initialBookingRules.lastMinuteBookingAdminOnly);
  const [lastMinuteBookingThresholdHours, setLastMinuteBookingThresholdHours] = useState(String(initialBookingRules.lastMinuteBookingThresholdHours));
  const [lastMinuteBookingExtraPercent, setLastMinuteBookingExtraPercent] = useState(String(initialBookingRules.lastMinuteBookingExtraPercent));
  const [maintenanceModuleEnabled, setMaintenanceModuleEnabled] = useState(initialFleetOperations.maintenanceModuleEnabled);
  const [inventoryModuleEnabled, setInventoryModuleEnabled] = useState(initialFleetOperations.inventoryModuleEnabled);
  const [vehicleFinancialTrackingEnabled, setVehicleFinancialTrackingEnabled] = useState(initialFleetOperations.vehicleFinancialTrackingEnabled);
  const [remindersModuleEnabled, setRemindersModuleEnabled] = useState(initialFleetOperations.remindersModuleEnabled);
  const [defaultSmallServiceIntervalKm, setDefaultSmallServiceIntervalKm] = useState(String(initialFleetOperations.defaultSmallServiceIntervalKm));
  const [defaultBigServiceIntervalKm, setDefaultBigServiceIntervalKm] = useState(String(initialFleetOperations.defaultBigServiceIntervalKm));
  const [serviceDueSoonThresholdKm, setServiceDueSoonThresholdKm] = useState(String(initialFleetOperations.serviceDueSoonThresholdKm ?? ""));
  const [insuranceFeatureEnabled, setInsuranceFeatureEnabled] = useState(initialFleetOperations.insuranceFeatureEnabled);
  const [insuranceReminderDaysBefore, setInsuranceReminderDaysBefore] = useState(String(initialFleetOperations.insuranceReminderDaysBefore));
  const [inspectionFeatureEnabled, setInspectionFeatureEnabled] = useState(initialFleetOperations.inspectionFeatureEnabled);
  const [inspectionReminderDaysBefore, setInspectionReminderDaysBefore] = useState(String(initialFleetOperations.inspectionReminderDaysBefore));
  const [inspectionLabel, setInspectionLabel] = useState(initialFleetOperations.inspectionLabel);
  const [inspectionLocalizedLabelNl, setInspectionLocalizedLabelNl] = useState(initialFleetOperations.inspectionLocalizedLabelNl || "");
  const [blockVehicleBookingIfInsuranceExpired, setBlockVehicleBookingIfInsuranceExpired] = useState(initialFleetOperations.blockVehicleBookingIfInsuranceExpired);
  const [blockVehicleBookingIfInspectionExpired, setBlockVehicleBookingIfInspectionExpired] = useState(initialFleetOperations.blockVehicleBookingIfInspectionExpired);
  const [blockVehicleBookingIfMaintenanceOverdue, setBlockVehicleBookingIfMaintenanceOverdue] = useState(initialFleetOperations.blockVehicleBookingIfMaintenanceOverdue);
  const [tenantName, setTenantName] = useState(initialTenant.tenantName);
  const [logoUrl, setLogoUrl] = useState(initialTenant.logoUrl);
  const [phone, setPhone] = useState(initialTenant.phone);
  const [whatsapp, setWhatsapp] = useState(initialTenant.whatsapp);
  const [whatsappUrl, setWhatsappUrl] = useState(initialTenant.whatsappUrl || "");
  const [facebookUrl, setFacebookUrl] = useState(initialTenant.facebookUrl || "");
  const [instagramUrl, setInstagramUrl] = useState(initialTenant.instagramUrl || "");
  const [linkedinUrl, setLinkedinUrl] = useState(initialTenant.linkedinUrl || "");
  const [tiktokUrl, setTiktokUrl] = useState(initialTenant.tiktokUrl || "");
  const [email, setEmail] = useState(initialTenant.email);
  const [address, setAddress] = useState(initialTenant.address);
  const [currency, setCurrency] = useState(initialTenant.currency);
  const [paymentInstructions, setPaymentInstructions] = useState(initialTenant.paymentInstructions);
  const [termsPdfUrl, setTermsPdfUrl] = useState(initialTenant.termsPdfUrl);
  const [themePrimary, setThemePrimary] = useState(initialTenant.theme.primary);
  const [themePrimaryForeground, setThemePrimaryForeground] = useState(initialTenant.theme.primaryForeground);
  const [themeAccent, setThemeAccent] = useState(initialTenant.theme.accent);
  const [themeAccentForeground, setThemeAccentForeground] = useState(initialTenant.theme.accentForeground);
  const [themeRing, setThemeRing] = useState(initialTenant.theme.ring);
  const [themeSidebarPrimary, setThemeSidebarPrimary] = useState(initialTenant.theme.sidebarPrimary);
  const [themeSidebarPrimaryForeground, setThemeSidebarPrimaryForeground] = useState(initialTenant.theme.sidebarPrimaryForeground);
  const [themeSidebarAccent, setThemeSidebarAccent] = useState(initialTenant.theme.sidebarAccent);
  const [themeSidebarAccentForeground, setThemeSidebarAccentForeground] = useState(initialTenant.theme.sidebarAccentForeground);
  const [quickBooksEnabled, setQuickBooksEnabled] = useState(initialQuickBooks.dbEnabled);
  const [quickBooksVisible, setQuickBooksVisible] = useState(initialQuickBooks.dbVisible);
  const [quickBooksClientId, setQuickBooksClientId] = useState(initialQuickBooksSetup.clientId);
  const [quickBooksClientSecret, setQuickBooksClientSecret] = useState(initialQuickBooksSetup.clientSecret);
  const [quickBooksRedirectUri, setQuickBooksRedirectUri] = useState(initialQuickBooksSetup.redirectUri || `${browserBaseUrl}/api/integrations/quickbooks/callback`);
  const [quickBooksEnvironment, setQuickBooksEnvironment] = useState<"production" | "sandbox">(initialQuickBooksSetup.environment);
  const [quickBooksItemId, setQuickBooksItemId] = useState(initialQuickBooksSetup.itemId);
  const [invoiceProvider, setInvoiceProvider] = useState<InvoiceProvider>(initialInvoiceProvider);
  const [zohoOrganizationId, setZohoOrganizationId] = useState(initialZohoOrganizationId);
  const [zohoRefreshToken, setZohoRefreshToken] = useState("");
  const [zohoClientId, setZohoClientId] = useState(initialZohoSetup.clientId);
  const [zohoClientSecret, setZohoClientSecret] = useState(initialZohoSetup.clientSecret);
  const [zohoRedirectUri, setZohoRedirectUri] = useState(initialZohoSetup.redirectUri || `${browserBaseUrl}/api/integrations/zoho/callback`);
  const [zohoAccountsBaseUrl, setZohoAccountsBaseUrl] = useState(initialZohoSetup.accountsBaseUrl);
  const [zohoApiBaseUrl, setZohoApiBaseUrl] = useState(initialZohoSetup.apiBaseUrl);
  const [quickBooksHealth, setQuickBooksHealth] = useState<ProviderHealthState>({ loading: false });
  const [zohoHealth, setZohoHealth] = useState<ProviderHealthState>({ loading: false });
  const [integrationBanner, setIntegrationBanner] = useState(integrationFeedback);
  const [isSaving, setIsSaving] = useState(false);
  const sectionClass =
    "overflow-hidden rounded-[1.75rem] border border-slate-200/90 bg-[linear-gradient(180deg,#ffffff,rgba(246,249,255,0.96))] shadow-[0_28px_60px_-42px_rgba(15,23,42,0.34)]";
  const sectionBodyClass = "space-y-5 p-5 sm:p-6";
  const inputClass =
    "rounded-xl border-slate-200 bg-white/90 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.55)] transition focus-visible:border-sky-300 focus-visible:ring-sky-200";
  const toggleCardClass =
    "flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_18px_38px_-32px_rgba(15,23,42,0.4)]";
  const stats = [
    {
      label: t("admin.settings.taxPercentage"),
      value: `${taxPercentage || 0}%`,
      tone: "from-sky-50 to-white text-sky-700 border-sky-200",
    },
    {
      label: t("admin.settings.minimumBookingDays"),
      value: minimumBookingDays || "1",
      tone: "from-emerald-50 to-white text-emerald-700 border-emerald-200",
    },
    {
      label: t("admin.settings.bookingRules.minimumSectionTitle"),
      value: belowMinimumRentalAdminOnly ? t("admin.settings.bookingRules.adminOnly") : t("admin.settings.bookingRules.publicAllowed"),
      tone: "from-teal-50 to-white text-teal-700 border-teal-200",
    },
    {
      label: t("admin.settings.bookingRules.lastMinuteSectionTitle"),
      value: lastMinuteBookingEnabled
        ? `${lastMinuteBookingThresholdHours || "24"}h · +${lastMinuteBookingExtraPercent || "0"}%`
        : t("common.no"),
      tone: "from-fuchsia-50 to-white text-fuchsia-700 border-fuchsia-200",
    },
    {
      label: t("admin.settings.bookingHoldDays"),
      value: bookingHoldDays || "1",
      tone: "from-rose-50 to-white text-rose-700 border-rose-200",
    },
    {
      label: t("admin.settings.vehicleRatesTaxMode.label"),
      value: vehicleRatesIncludeTax
        ? t("admin.settings.vehicleRatesTaxMode.included")
        : t("admin.settings.vehicleRatesTaxMode.excluded"),
      tone: "from-amber-50 to-white text-amber-700 border-amber-200",
    },
    {
      label: t("admin.settings.integrations.title"),
      value: invoiceProvider === "ZOHO"
        ? t("admin.settings.integrations.providerZoho")
        : invoiceProvider === "QUICKBOOKS"
          ? t("admin.settings.integrations.providerQuickbooks")
          : t("common.no"),
      tone: "from-violet-50 to-white text-violet-700 border-violet-200",
    },
  ];

  useEffect(() => {
    if (!integrationFeedback?.provider || !integrationFeedback?.status) return;
    setIntegrationBanner(integrationFeedback);
    const label = integrationFeedback.provider.toLowerCase() === "zoho" ? "Zoho" : "QuickBooks";
    if (integrationFeedback.status === "connected") {
      toast.success(`${label} connected successfully.`);
    } else if (integrationFeedback.status === "error") {
      toast.error(integrationFeedback.message || `${label} connection failed.`);
    }
    router.replace(`/${locale}/admin/settings`);
  }, [integrationFeedback, locale, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    if (!quickBooksRedirectUri) {
      setQuickBooksRedirectUri(`${origin}/api/integrations/quickbooks/callback`);
    }
    if (!zohoRedirectUri) {
      setZohoRedirectUri(`${origin}/api/integrations/zoho/callback`);
    }
  }, [quickBooksRedirectUri, zohoRedirectUri]);

  const quickBooksCredsValid = Boolean(
    quickBooksClientId.trim() && quickBooksClientSecret.trim() && quickBooksRedirectUri.trim()
  );
  const zohoCredsValid = Boolean(
    zohoClientId.trim() &&
      zohoClientSecret.trim() &&
      zohoRedirectUri.trim() &&
      zohoAccountsBaseUrl.trim() &&
      zohoApiBaseUrl.trim()
  );
  const quickBooksConnected = Boolean(
    initialQuickBooksSetup.hasRefreshToken ||
      quickBooksHealth.summary?.startsWith("Connected")
  );
  const zohoConnected = Boolean(
    initialZohoSetup.hasRefreshToken ||
      zohoHealth.summary?.startsWith("Connected")
  );
  const quickBooksCanConnect = invoiceProvider === "QUICKBOOKS" && quickBooksCredsValid && !isSaving;
  const zohoCanConnect = invoiceProvider === "ZOHO" && zohoCredsValid && !isSaving;
  const quickBooksSavedButNotConnected = quickBooksCredsValid && !quickBooksConnected;
  const zohoSavedButNotConnected = zohoCredsValid && !zohoConnected;

  const quickBooksStatus = quickBooksConnected
    ? { label: "Connected", tone: "border-emerald-200 bg-emerald-50 text-emerald-700" }
    : quickBooksCredsValid
      ? { label: "Ready to connect", tone: "border-amber-200 bg-amber-50 text-amber-700" }
      : { label: "Needs setup", tone: "border-slate-200 bg-slate-100 text-slate-600" };

  const zohoStatus = zohoConnected
    ? { label: "Connected", tone: "border-emerald-200 bg-emerald-50 text-emerald-700" }
    : zohoCredsValid
      ? { label: "Ready to connect", tone: "border-amber-200 bg-amber-50 text-amber-700" }
      : { label: "Needs setup", tone: "border-slate-200 bg-slate-100 text-slate-600" };

  const connectProvider = (provider: "quickbooks" | "zoho") => {
    window.location.href = `/api/integrations/${provider}/connect?locale=${encodeURIComponent(locale)}`;
  };

  const runHealthCheck = async (provider: "quickbooks" | "zoho") => {
    const setState = provider === "quickbooks" ? setQuickBooksHealth : setZohoHealth;
    setState({ loading: true });
    try {
      const response = await fetch(`/api/integrations/${provider}/health`, { method: "GET" });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || `${provider} health check failed`);
      }
      const summary =
        provider === "quickbooks"
          ? payload?.token?.tokenValid
            ? `Connected${payload?.realmId ? ` · realm ${payload.realmId}` : ""}`
            : payload?.token?.error || "Not connected"
          : payload?.token?.tokenValid
            ? `Connected${payload?.organizationId ? ` · org ${payload.organizationId}` : ""}`
            : payload?.token?.error || "Not connected";
      const details =
        provider === "quickbooks"
          ? [
              payload?.redirectUri ? `Redirect URI: ${String(payload.redirectUri)}` : null,
              payload?.runtime?.environment ? `Environment: ${String(payload.runtime.environment)}` : null,
              payload?.realmId ? `Realm ID: ${String(payload.realmId)}` : "Realm ID: not connected yet",
              payload?.runtime?.hasRefreshToken ? "Refresh token stored" : "Refresh token missing",
            ].filter(Boolean) as string[]
          : [
              payload?.redirectUri ? `Redirect URI: ${String(payload.redirectUri)}` : null,
              payload?.organizationId ? `Organization ID: ${String(payload.organizationId)}` : "Organization ID: not selected yet",
              Array.isArray(payload?.organizations) ? `Organizations found: ${payload.organizations.length}` : null,
              payload?.token?.tokenValid ? "Refresh token valid" : "Refresh token missing or invalid",
            ].filter(Boolean) as string[];
      setState({ loading: false, summary, details });
      toast.success(`${provider === "quickbooks" ? "QuickBooks" : "Zoho"} health check completed.`);
    } catch (error: any) {
      const message = String(error?.message || "Health check failed");
      setState({ loading: false, error: message, details: [] });
      toast.error(message);
    }
  };

  const onSave = async () => {
    const parsedTax = Number(taxPercentage);
    if (!Number.isFinite(parsedTax) || parsedTax < 0 || parsedTax > 100) {
      toast.error(t("admin.settings.errors.invalidTax"));
      return;
    }
    const parsedMinimumDays = Number(minimumBookingDays);
    if (!Number.isFinite(parsedMinimumDays) || parsedMinimumDays < 1 || parsedMinimumDays > 365) {
      toast.error(t("admin.settings.errors.invalidMinDays"));
      return;
    }
    const parsedBookingHoldDays = Number(bookingHoldDays);
    if (!Number.isFinite(parsedBookingHoldDays) || parsedBookingHoldDays < 1 || parsedBookingHoldDays > 30) {
      toast.error(t("admin.settings.errors.invalidBookingHoldDays"));
      return;
    }
    const parsedBelowMinimumSurchargeValue = Number(belowMinimumRentalSurchargeValue);
    if (!Number.isFinite(parsedBelowMinimumSurchargeValue) || parsedBelowMinimumSurchargeValue < 0 || parsedBelowMinimumSurchargeValue > 1000000) {
      toast.error(t("admin.settings.errors.invalidBelowMinimumSurcharge"));
      return;
    }
    const parsedLastMinuteThresholdHours = Number(lastMinuteBookingThresholdHours);
    if (!Number.isFinite(parsedLastMinuteThresholdHours) || parsedLastMinuteThresholdHours < 1 || parsedLastMinuteThresholdHours > 720) {
      toast.error(t("admin.settings.errors.invalidLastMinuteThreshold"));
      return;
    }
    const parsedLastMinuteExtraPercent = Number(lastMinuteBookingExtraPercent);
    if (!Number.isFinite(parsedLastMinuteExtraPercent) || parsedLastMinuteExtraPercent < 0 || parsedLastMinuteExtraPercent > 1000) {
      toast.error(t("admin.settings.errors.invalidLastMinutePercent"));
      return;
    }
    const parsedSmallServiceKm = Number(defaultSmallServiceIntervalKm);
    const parsedBigServiceKm = Number(defaultBigServiceIntervalKm);
    const parsedInsuranceReminderDays = Number(insuranceReminderDaysBefore);
    const parsedInspectionReminderDays = Number(inspectionReminderDaysBefore);
    if (!Number.isFinite(parsedSmallServiceKm) || parsedSmallServiceKm < 0) {
      toast.error("Enter a valid default small service interval.");
      return;
    }
    if (!Number.isFinite(parsedBigServiceKm) || parsedBigServiceKm < 0) {
      toast.error("Enter a valid default big service interval.");
      return;
    }
    if (!Number.isFinite(parsedInsuranceReminderDays) || parsedInsuranceReminderDays < 0) {
      toast.error("Enter a valid insurance reminder period.");
      return;
    }
    if (!Number.isFinite(parsedInspectionReminderDays) || parsedInspectionReminderDays < 0) {
      toast.error("Enter a valid inspection reminder period.");
      return;
    }
    if (!tenantName.trim() || !email.trim() || !currency.trim()) {
      toast.error(t("admin.settings.errors.requiredTenantFields"));
      return;
    }
    if (invoiceProvider === "QUICKBOOKS" && (!quickBooksClientId.trim() || !quickBooksClientSecret.trim())) {
      toast.error("Enter QuickBooks client ID and client secret first.");
      return;
    }
    if (invoiceProvider === "ZOHO" && (!zohoClientId.trim() || !zohoClientSecret.trim())) {
      toast.error("Enter Zoho client ID and client secret first.");
      return;
    }

    setIsSaving(true);
    const [taxResult, vehicleTaxModeResult, minDaysResult, bookingHoldDaysResult, bookingRulesResult, fleetOperationsResult, saasResult] = await Promise.all([
      updateTaxPercentageAction(parsedTax, locale),
      updateVehicleRatesIncludeTaxAction(vehicleRatesIncludeTax, locale),
      updateMinimumBookingDaysAction(parsedMinimumDays, locale),
      updateBookingHoldDaysAction(parsedBookingHoldDays, locale),
      updateBookingRuleSettingsAction(
        {
          minimumRentalDays: parsedMinimumDays,
          belowMinimumRentalAdminOnly,
          belowMinimumRentalPricingEnabled,
          belowMinimumRentalSurchargeMode,
          belowMinimumRentalSurchargeValue: parsedBelowMinimumSurchargeValue,
          lastMinuteBookingEnabled,
          lastMinuteBookingAdminOnly,
          lastMinuteBookingThresholdHours: parsedLastMinuteThresholdHours,
          lastMinuteBookingExtraPercent: parsedLastMinuteExtraPercent,
        },
        locale
      ),
      updateFleetOperationsSettingsAction(
        {
          maintenanceModuleEnabled,
          inventoryModuleEnabled,
          vehicleFinancialTrackingEnabled,
          remindersModuleEnabled,
          defaultSmallServiceIntervalKm: parsedSmallServiceKm,
          defaultBigServiceIntervalKm: parsedBigServiceKm,
          serviceDueSoonThresholdKm: serviceDueSoonThresholdKm ? Number(serviceDueSoonThresholdKm) : undefined,
          allowCategoryLevelMaintenanceTemplates: true,
          allowVehicleLevelMaintenanceOverrides: true,
          vehicleMaintenanceAvailabilityBlockEnabled: true,
          lowStockThresholdEnabled: true,
          defaultLowStockThreshold: 2,
          insuranceFeatureEnabled,
          insuranceReminderEnabled: true,
          insuranceReminderDaysBefore: parsedInsuranceReminderDays,
          insuranceGracePeriodDays: undefined,
          inspectionFeatureEnabled,
          inspectionReminderEnabled: true,
          inspectionReminderDaysBefore: parsedInspectionReminderDays,
          inspectionGracePeriodDays: undefined,
          inspectionLabel,
          inspectionLocalizedLabelNl,
          dashboardReminderWidgetsEnabled: true,
          reminderSeverityDueSoonDays: undefined,
          reminderSeverityDueSoonKm: serviceDueSoonThresholdKm ? Number(serviceDueSoonThresholdKm) : undefined,
          blockVehicleBookingIfInsuranceExpired,
          blockVehicleBookingIfInspectionExpired,
          blockVehicleBookingIfMaintenanceOverdue,
        },
        locale
      ),
      updateSaasSettingsAction(
        {
          tenantName,
          logoUrl,
          phone,
          whatsapp,
          whatsappUrl,
          facebookUrl,
          instagramUrl,
          linkedinUrl,
          tiktokUrl,
          email,
          address,
          currency,
          paymentInstructions,
          termsPdfUrl,
          themePrimary,
          themePrimaryForeground,
          themeAccent,
          themeAccentForeground,
          themeRing,
          themeSidebarPrimary,
          themeSidebarPrimaryForeground,
          themeSidebarAccent,
          themeSidebarAccentForeground,
          invoiceProvider,
          quickBooksEnabled,
          quickBooksVisible,
          quickBooksClientId,
          quickBooksClientSecret,
          quickBooksRedirectUri,
          quickBooksEnvironment,
          quickBooksItemId,
          zohoOrganizationId,
          zohoRefreshToken,
          zohoClientId,
          zohoClientSecret,
          zohoRedirectUri,
          zohoAccountsBaseUrl,
          zohoApiBaseUrl,
        },
        locale
      ),
    ]);
    setIsSaving(false);

    if (!taxResult.success || !vehicleTaxModeResult.success || !minDaysResult.success || !bookingHoldDaysResult.success || !bookingRulesResult.success || !fleetOperationsResult.success || !saasResult.success) {
      toast.error(
        taxResult.error ||
          vehicleTaxModeResult.error ||
          minDaysResult.error ||
          bookingHoldDaysResult.error ||
          bookingRulesResult.error ||
          fleetOperationsResult.error ||
          saasResult.error ||
          t("admin.settings.errors.updateFailed")
      );
      return;
    }

    setTaxPercentage(String(taxResult.taxPercentage));
    setVehicleRatesIncludeTax(vehicleTaxModeResult.vehicleRatesIncludeTax);
    setMinimumBookingDays(String(minDaysResult.minimumBookingDays));
    setBookingHoldDays(String(bookingHoldDaysResult.bookingHoldDays));
    setBelowMinimumRentalAdminOnly(bookingRulesResult.bookingRules.belowMinimumRentalAdminOnly);
    setBelowMinimumRentalPricingEnabled(bookingRulesResult.bookingRules.belowMinimumRentalPricingEnabled);
    setBelowMinimumRentalSurchargeMode(bookingRulesResult.bookingRules.belowMinimumRentalSurchargeMode);
    setBelowMinimumRentalSurchargeValue(String(bookingRulesResult.bookingRules.belowMinimumRentalSurchargeValue));
    setLastMinuteBookingEnabled(bookingRulesResult.bookingRules.lastMinuteBookingEnabled);
    setLastMinuteBookingAdminOnly(bookingRulesResult.bookingRules.lastMinuteBookingAdminOnly);
    setLastMinuteBookingThresholdHours(String(bookingRulesResult.bookingRules.lastMinuteBookingThresholdHours));
    setLastMinuteBookingExtraPercent(String(bookingRulesResult.bookingRules.lastMinuteBookingExtraPercent));
    setMaintenanceModuleEnabled(fleetOperationsResult.fleetOperations.maintenanceModuleEnabled);
    setInventoryModuleEnabled(fleetOperationsResult.fleetOperations.inventoryModuleEnabled);
    setVehicleFinancialTrackingEnabled(fleetOperationsResult.fleetOperations.vehicleFinancialTrackingEnabled);
    setRemindersModuleEnabled(fleetOperationsResult.fleetOperations.remindersModuleEnabled);
    setDefaultSmallServiceIntervalKm(String(fleetOperationsResult.fleetOperations.defaultSmallServiceIntervalKm));
    setDefaultBigServiceIntervalKm(String(fleetOperationsResult.fleetOperations.defaultBigServiceIntervalKm));
    setServiceDueSoonThresholdKm(String(fleetOperationsResult.fleetOperations.serviceDueSoonThresholdKm ?? ""));
    setInsuranceFeatureEnabled(fleetOperationsResult.fleetOperations.insuranceFeatureEnabled);
    setInsuranceReminderDaysBefore(String(fleetOperationsResult.fleetOperations.insuranceReminderDaysBefore));
    setInspectionFeatureEnabled(fleetOperationsResult.fleetOperations.inspectionFeatureEnabled);
    setInspectionReminderDaysBefore(String(fleetOperationsResult.fleetOperations.inspectionReminderDaysBefore));
    setInspectionLabel(fleetOperationsResult.fleetOperations.inspectionLabel);
    setInspectionLocalizedLabelNl(fleetOperationsResult.fleetOperations.inspectionLocalizedLabelNl || "");
    setBlockVehicleBookingIfInsuranceExpired(fleetOperationsResult.fleetOperations.blockVehicleBookingIfInsuranceExpired);
    setBlockVehicleBookingIfInspectionExpired(fleetOperationsResult.fleetOperations.blockVehicleBookingIfInspectionExpired);
    setBlockVehicleBookingIfMaintenanceOverdue(fleetOperationsResult.fleetOperations.blockVehicleBookingIfMaintenanceOverdue);
    setQuickBooksEnabled(saasResult.quickBooks.dbEnabled);
    setQuickBooksVisible(saasResult.quickBooks.dbVisible);
    setQuickBooksClientId(saasResult.quickBooksSetup.clientId);
    setQuickBooksClientSecret(saasResult.quickBooksSetup.clientSecret);
    setQuickBooksRedirectUri(saasResult.quickBooksSetup.redirectUri);
    setQuickBooksEnvironment(saasResult.quickBooksSetup.environment);
    setQuickBooksItemId(saasResult.quickBooksSetup.itemId);
    setInvoiceProvider(saasResult.invoiceProvider);
    setZohoOrganizationId(saasResult.zoho.organizationId);
    setZohoClientId(saasResult.zohoSetup.clientId);
    setZohoClientSecret(saasResult.zohoSetup.clientSecret);
    setZohoRedirectUri(saasResult.zohoSetup.redirectUri);
    setZohoAccountsBaseUrl(saasResult.zohoSetup.accountsBaseUrl);
    setZohoApiBaseUrl(saasResult.zohoSetup.apiBaseUrl);
    setZohoRefreshToken("");
    toast.success(t("admin.settings.messages.updated"));
    router.refresh();
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-28">
      {integrationBanner ? (
        <Card className={`overflow-hidden rounded-[1.5rem] border shadow-[0_22px_50px_-38px_rgba(15,23,42,0.45)] ${
          integrationBanner.status === "connected"
            ? "border-emerald-200 bg-emerald-50/90"
            : "border-rose-200 bg-rose-50/90"
        }`}>
          <div className="flex items-start justify-between gap-4 p-5">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">
                {integrationBanner.provider.toLowerCase() === "zoho" ? "Zoho" : "QuickBooks"} connection{" "}
                {integrationBanner.status === "connected" ? "completed" : "needs attention"}
              </p>
              <p className="text-sm text-slate-700">
                {integrationBanner.message ||
                  (integrationBanner.status === "connected"
                    ? "The provider returned to settings successfully."
                    : "The provider callback returned an error. Check the details below before retrying.")}
              </p>
            </div>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIntegrationBanner(null)}>
              Dismiss
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%),linear-gradient(135deg,#ffffff,rgba(241,247,255,0.97))] shadow-[0_35px_90px_-50px_rgba(15,23,42,0.4)]">
        <div className="p-6 sm:p-7">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t("admin.settings.title")}
              </div>
              <p className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                {t("admin.settings.subtitle")}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:w-[520px]">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className={`rounded-2xl border bg-gradient-to-br px-4 py-3 shadow-[0_22px_42px_-34px_rgba(15,23,42,0.45)] ${stat.tone}`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">{stat.label}</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className={sectionClass}>
        <div className={sectionBodyClass}>
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700 ring-1 ring-sky-200">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{t("admin.settings.title")}</h3>
              <p className="mt-1 text-sm text-slate-600">{t("admin.settings.subtitle")}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.32)]">
              <label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.taxPercentage")}</label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={taxPercentage}
                onChange={(e) => setTaxPercentage(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.32)]">
              <label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.minimumBookingDays")}</label>
              <Input
                type="number"
                min={1}
                max={365}
                step={1}
                value={minimumBookingDays}
                onChange={(e) => setMinimumBookingDays(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.32)]">
              <label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.bookingHoldDays")}</label>
              <Input
                type="number"
                min={1}
                max={30}
                step={1}
                value={bookingHoldDays}
                onChange={(e) => setBookingHoldDays(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="rounded-2xl border border-amber-200 bg-[linear-gradient(180deg,#fffdf6,#ffffff)] p-4 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.32)]">
              <label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.vehicleRatesTaxMode.label")}</label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-white/95 px-3 py-3 text-sm shadow-sm">
                <input
                  type="checkbox"
                  checked={vehicleRatesIncludeTax}
                  onChange={(e) => setVehicleRatesIncludeTax(e.target.checked)}
                  className="mt-1"
                />
                <span className="space-y-1">
                  <span className="block font-semibold text-slate-900">
                    {vehicleRatesIncludeTax
                      ? t("admin.settings.vehicleRatesTaxMode.included")
                      : t("admin.settings.vehicleRatesTaxMode.excluded")}
                  </span>
                  <span className="block text-xs leading-5 text-slate-600">
                    {t("admin.settings.vehicleRatesTaxMode.description")}
                  </span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </Card>

      <Card className={sectionClass}>
        <div className={sectionBodyClass}>
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 ring-1 ring-slate-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Fleet Operations / Maintenance / Compliance</h3>
              <p className="mt-1 text-sm text-slate-600">Enable maintenance, inventory, reminders, and compliance behavior without adding a separate settings system.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Maintenance module", maintenanceModuleEnabled, setMaintenanceModuleEnabled],
              ["Inventory module", inventoryModuleEnabled, setInventoryModuleEnabled],
              ["Vehicle financial tracking", vehicleFinancialTrackingEnabled, setVehicleFinancialTrackingEnabled],
              ["Reminder widgets", remindersModuleEnabled, setRemindersModuleEnabled],
            ].map(([label, checked, setter]) => (
              <label key={label as string} className={toggleCardClass}>
                <span className="w-full">
                  <span className="block font-semibold text-slate-900">{label as string}</span>
                </span>
                <input type="checkbox" checked={checked as boolean} onChange={(e) => (setter as (value: boolean) => void)(e.target.checked)} className="mt-1" />
              </label>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Default small service interval (km)</label>
              <Input type="number" value={defaultSmallServiceIntervalKm} onChange={(e) => setDefaultSmallServiceIntervalKm(e.target.value)} className={inputClass} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Default big service interval (km)</label>
              <Input type="number" value={defaultBigServiceIntervalKm} onChange={(e) => setDefaultBigServiceIntervalKm(e.target.value)} className={inputClass} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Service due soon threshold (km)</label>
              <Input type="number" value={serviceDueSoonThresholdKm} onChange={(e) => setServiceDueSoonThresholdKm(e.target.value)} className={inputClass} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Insurance reminder days before</label>
              <Input type="number" value={insuranceReminderDaysBefore} onChange={(e) => setInsuranceReminderDaysBefore(e.target.value)} className={inputClass} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Inspection reminder days before</label>
              <Input type="number" value={inspectionReminderDaysBefore} onChange={(e) => setInspectionReminderDaysBefore(e.target.value)} className={inputClass} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Inspection label</label>
              <Input value={inspectionLabel} onChange={(e) => setInspectionLabel(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className={toggleCardClass}>
              <span className="w-full space-y-1">
                <span className="block font-semibold text-slate-900">Insurance feature</span>
                <span className="block text-sm text-slate-600">Enable insurance history and expiry reminders per vehicle.</span>
              </span>
              <input type="checkbox" checked={insuranceFeatureEnabled} onChange={(e) => setInsuranceFeatureEnabled(e.target.checked)} className="mt-1" />
            </label>
            <label className={toggleCardClass}>
              <span className="w-full space-y-1">
                <span className="block font-semibold text-slate-900">Inspection feature</span>
                <span className="block text-sm text-slate-600">Enable inspection / keurings tracking and reminders.</span>
              </span>
              <input type="checkbox" checked={inspectionFeatureEnabled} onChange={(e) => setInspectionFeatureEnabled(e.target.checked)} className="mt-1" />
            </label>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Inspection label NL</label>
              <Input value={inspectionLocalizedLabelNl} onChange={(e) => setInspectionLocalizedLabelNl(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className={toggleCardClass}>
              <span className="w-full space-y-1">
                <span className="block font-semibold text-slate-900">Block booking if insurance expired</span>
              </span>
              <input type="checkbox" checked={blockVehicleBookingIfInsuranceExpired} onChange={(e) => setBlockVehicleBookingIfInsuranceExpired(e.target.checked)} className="mt-1" />
            </label>
            <label className={toggleCardClass}>
              <span className="w-full space-y-1">
                <span className="block font-semibold text-slate-900">Block booking if inspection expired</span>
              </span>
              <input type="checkbox" checked={blockVehicleBookingIfInspectionExpired} onChange={(e) => setBlockVehicleBookingIfInspectionExpired(e.target.checked)} className="mt-1" />
            </label>
            <label className={toggleCardClass}>
              <span className="w-full space-y-1">
                <span className="block font-semibold text-slate-900">Block booking if maintenance overdue</span>
              </span>
              <input type="checkbox" checked={blockVehicleBookingIfMaintenanceOverdue} onChange={(e) => setBlockVehicleBookingIfMaintenanceOverdue(e.target.checked)} className="mt-1" />
            </label>
          </div>
        </div>
      </Card>

      <Card className={sectionClass}>
        <div className={sectionBodyClass}>
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-teal-100 p-3 text-teal-700 ring-1 ring-teal-200">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{t("admin.settings.bookingRules.title")}</h3>
              <p className="mt-1 text-sm text-slate-600">{t("admin.settings.bookingRules.description")}</p>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-[1.6rem] border border-slate-200 bg-[linear-gradient(180deg,#f7fcfb,#ffffff)] p-5 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.35)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-900">{t("admin.settings.bookingRules.minimumSectionTitle")}</p>
                  <p className="mt-1 text-sm text-slate-600">{t("admin.settings.bookingRules.minimumSectionDescription")}</p>
                </div>
                <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                  {minimumBookingDays} {t("booking.days").toLowerCase()}
                </span>
              </div>

              <div className="mt-5 grid gap-4">
                <label className={toggleCardClass}>
                  <span className="w-full space-y-1">
                    <span className="block font-semibold text-slate-900">{t("admin.settings.bookingRules.belowMinimumRentalAdminOnly")}</span>
                    <span className="block text-sm text-slate-600">{t("admin.settings.bookingRules.belowMinimumRentalAdminOnlyDescription")}</span>
                  </span>
                  <input type="checkbox" checked={belowMinimumRentalAdminOnly} onChange={(e) => setBelowMinimumRentalAdminOnly(e.target.checked)} className="mt-1" />
                </label>

                <label className={toggleCardClass}>
                  <span className="w-full space-y-1">
                    <span className="block font-semibold text-slate-900">{t("admin.settings.bookingRules.belowMinimumRentalPricingEnabled")}</span>
                    <span className="block text-sm text-slate-600">{t("admin.settings.bookingRules.belowMinimumRentalPricingEnabledDescription")}</span>
                  </span>
                  <input type="checkbox" checked={belowMinimumRentalPricingEnabled} onChange={(e) => setBelowMinimumRentalPricingEnabled(e.target.checked)} className="mt-1" />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.32)]">
                    <span className="block text-sm font-semibold text-slate-700">{t("admin.settings.bookingRules.belowMinimumRentalSurchargeMode")}</span>
                    <select
                      value={belowMinimumRentalSurchargeMode}
                      onChange={(e) => setBelowMinimumRentalSurchargeMode(e.target.value as BelowMinimumRentalSurchargeMode)}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-200"
                    >
                      <option value="percentage_on_base_total">{t("admin.settings.bookingRules.surchargeModes.percentage_on_base_total")}</option>
                      <option value="percentage_on_current_total">{t("admin.settings.bookingRules.surchargeModes.percentage_on_current_total")}</option>
                      <option value="fixed_amount">{t("admin.settings.bookingRules.surchargeModes.fixed_amount")}</option>
                    </select>
                  </label>

                  <label className="space-y-2 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.32)]">
                    <span className="block text-sm font-semibold text-slate-700">{t("admin.settings.bookingRules.belowMinimumRentalSurchargeValue")}</span>
                    <Input
                      type="number"
                      min={0}
                      max={1000000}
                      step={belowMinimumRentalSurchargeMode === "fixed_amount" ? 100 : 0.01}
                      value={belowMinimumRentalSurchargeValue}
                      onChange={(e) => setBelowMinimumRentalSurchargeValue(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-slate-200 bg-[linear-gradient(180deg,#fcf9ff,#ffffff)] p-5 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.35)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-900">{t("admin.settings.bookingRules.lastMinuteSectionTitle")}</p>
                  <p className="mt-1 text-sm text-slate-600">{t("admin.settings.bookingRules.lastMinuteSectionDescription")}</p>
                </div>
                <span className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-xs font-semibold text-fuchsia-700">
                  {lastMinuteBookingEnabled ? `${lastMinuteBookingThresholdHours || "24"}h` : t("common.no")}
                </span>
              </div>

              <div className="mt-5 grid gap-4">
                <label className={toggleCardClass}>
                  <span className="w-full space-y-1">
                    <span className="block font-semibold text-slate-900">{t("admin.settings.bookingRules.lastMinuteBookingEnabled")}</span>
                    <span className="block text-sm text-slate-600">{t("admin.settings.bookingRules.lastMinuteBookingEnabledDescription")}</span>
                  </span>
                  <input type="checkbox" checked={lastMinuteBookingEnabled} onChange={(e) => setLastMinuteBookingEnabled(e.target.checked)} className="mt-1" />
                </label>

                <label className={toggleCardClass}>
                  <span className="w-full space-y-1">
                    <span className="block font-semibold text-slate-900">{t("admin.settings.bookingRules.lastMinuteBookingAdminOnly")}</span>
                    <span className="block text-sm text-slate-600">{t("admin.settings.bookingRules.lastMinuteBookingAdminOnlyDescription")}</span>
                  </span>
                  <input type="checkbox" checked={lastMinuteBookingAdminOnly} onChange={(e) => setLastMinuteBookingAdminOnly(e.target.checked)} className="mt-1" />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.32)]">
                    <span className="block text-sm font-semibold text-slate-700">{t("admin.settings.bookingRules.lastMinuteBookingThresholdHours")}</span>
                    <Input
                      type="number"
                      min={1}
                      max={720}
                      step={1}
                      value={lastMinuteBookingThresholdHours}
                      onChange={(e) => setLastMinuteBookingThresholdHours(e.target.value)}
                      className={inputClass}
                    />
                  </label>

                  <label className="space-y-2 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.32)]">
                    <span className="block text-sm font-semibold text-slate-700">{t("admin.settings.bookingRules.lastMinuteBookingExtraPercent")}</span>
                    <Input
                      type="number"
                      min={0}
                      max={1000}
                      step={0.01}
                      value={lastMinuteBookingExtraPercent}
                      onChange={(e) => setLastMinuteBookingExtraPercent(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className={sectionClass}>
        <div className={sectionBodyClass}>
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 ring-1 ring-emerald-200">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{t("admin.settings.branding.title")}</h3>
              <p className="mt-1 text-sm text-slate-600">{t("admin.settings.branding.description")}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.branding.tenantName")}</label><Input value={tenantName} onChange={(e) => setTenantName(e.target.value)} className={inputClass} /></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.branding.logoUrl")}</label><Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className={inputClass} /></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.branding.email")}</label><Input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} /></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.branding.phone")}</label><Input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} /></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.branding.whatsappLabel")}</label><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={inputClass} /></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.branding.whatsappUrl")}</label><Input value={whatsappUrl} onChange={(e) => setWhatsappUrl(e.target.value)} className={inputClass} /></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.branding.facebookUrl")}</label><Input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} className={inputClass} /></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.branding.instagramUrl")}</label><Input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className={inputClass} /></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.branding.linkedinUrl")}</label><Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className={inputClass} /></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.branding.tiktokUrl")}</label><Input value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} className={inputClass} /></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.branding.currency")}</label><Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} className={inputClass} /></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.branding.termsPdfUrl")}</label><Input value={termsPdfUrl} onChange={(e) => setTermsPdfUrl(e.target.value)} className={inputClass} /></div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.branding.address")}</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.branding.paymentInstructions")}</label>
              <Textarea
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                className={`${inputClass} min-h-28`}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className={sectionClass}>
        <div className={sectionBodyClass}>
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-violet-100 p-3 text-violet-700 ring-1 ring-violet-200">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{t("admin.settings.theme.title")}</h3>
              <p className="mt-1 text-sm text-slate-600">{t("admin.settings.theme.description")}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.theme.primary")}</label><Input value={themePrimary} onChange={(e) => setThemePrimary(e.target.value)} className={inputClass} /></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.theme.primaryForeground")}</label><Input value={themePrimaryForeground} onChange={(e) => setThemePrimaryForeground(e.target.value)} className={inputClass} /></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.theme.accent")}</label><Input value={themeAccent} onChange={(e) => setThemeAccent(e.target.value)} className={inputClass} /></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.theme.accentForeground")}</label><Input value={themeAccentForeground} onChange={(e) => setThemeAccentForeground(e.target.value)} className={inputClass} /></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.theme.ring")}</label><Input value={themeRing} onChange={(e) => setThemeRing(e.target.value)} className={inputClass} /></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.theme.sidebarPrimary")}</label><Input value={themeSidebarPrimary} onChange={(e) => setThemeSidebarPrimary(e.target.value)} className={inputClass} /></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.theme.sidebarPrimaryForeground")}</label><Input value={themeSidebarPrimaryForeground} onChange={(e) => setThemeSidebarPrimaryForeground(e.target.value)} className={inputClass} /></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.theme.sidebarAccent")}</label><Input value={themeSidebarAccent} onChange={(e) => setThemeSidebarAccent(e.target.value)} className={inputClass} /></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.settings.theme.sidebarAccentForeground")}</label><Input value={themeSidebarAccentForeground} onChange={(e) => setThemeSidebarAccentForeground(e.target.value)} className={inputClass} /></div>
          </div>
        </div>
      </Card>

      <Card className={sectionClass}>
        <div className={sectionBodyClass}>
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700 ring-1 ring-cyan-200">
              <PlugZap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{t("admin.settings.integrations.title")}</h3>
              <p className="mt-1 text-sm text-slate-600">{t("admin.settings.integrations.description")}</p>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff,#ffffff)] p-5 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.35)]">
            <div className="mb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                {t("admin.settings.integrations.invoiceProvider")}
              </p>
              <p className="mt-1 text-sm text-slate-600">{t("admin.settings.integrations.description")}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { value: "NONE" as const, label: t("admin.settings.integrations.providerNone"), description: t("admin.settings.integrations.noneDescription") },
                { value: "QUICKBOOKS" as const, label: t("admin.settings.integrations.providerQuickbooks"), description: t("admin.settings.integrations.quickbooksDescription") },
                { value: "ZOHO" as const, label: t("admin.settings.integrations.providerZoho"), description: t("admin.settings.integrations.zohoDescription") },
              ].map((option) => {
                const active = invoiceProvider === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setInvoiceProvider(option.value)}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      active
                        ? "border-sky-300 bg-sky-50 shadow-[0_20px_40px_-30px_rgba(2,132,199,0.45)]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-slate-900">{option.label}</span>
                      {active ? <CheckCircle2 className="h-4 w-4 text-sky-600" /> : <span className="h-4 w-4 rounded-full border border-slate-300" />}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-600">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={toggleCardClass}>
              <span className="w-full space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="block font-semibold text-slate-900">QuickBooks setup wizard</span>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${quickBooksStatus.tone}`}>
                    {quickBooksStatus.label}
                  </span>
                </div>
                <ol className="space-y-3 text-sm text-slate-600">
                  <li><span className="font-semibold text-slate-900">Step 1.</span> Select QuickBooks as the invoice provider. {invoiceProvider === "QUICKBOOKS" ? "Done." : "Pending."}</li>
                  <li><span className="font-semibold text-slate-900">Step 2.</span> Enter your QuickBooks app credentials below and save. {quickBooksCredsValid ? "Ready." : "Required fields missing."}</li>
                  <li><span className="font-semibold text-slate-900">Step 3.</span> Click Connect QuickBooks and approve access. {quickBooksConnected ? "Connected." : "Pending."}</li>
                  <li><span className="font-semibold text-slate-900">Step 4.</span> Run Check QuickBooks to verify the live connection.</li>
                </ol>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => connectProvider("quickbooks")} disabled={!quickBooksCanConnect} className="rounded-xl">
                    Connect QuickBooks
                  </Button>
                  <Button type="button" variant="outline" onClick={() => runHealthCheck("quickbooks")} disabled={quickBooksHealth.loading || !quickBooksCredsValid} className="rounded-xl">
                    {quickBooksHealth.loading ? "Checking..." : "Check QuickBooks"}
                  </Button>
                </div>
                {!quickBooksCanConnect ? (
                  <p className="text-xs text-slate-500">Enable QuickBooks as provider, enter client ID, client secret, and redirect URI, then save before connecting.</p>
                ) : null}
                {quickBooksSavedButNotConnected ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-800">
                    Credentials are saved, but QuickBooks is not connected yet. Use the redirect URI below in Intuit, then click Connect QuickBooks.
                  </div>
                ) : null}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/85 px-4 py-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Connection details</p>
                  <p className="mt-1 break-all">Redirect URI: {quickBooksRedirectUri || `${browserBaseUrl}/api/integrations/quickbooks/callback`}</p>
                  <p className="mt-1">Environment: {quickBooksEnvironment}</p>
                  <p className="mt-1">Refresh token: {initialQuickBooksSetup.hasRefreshToken ? "stored" : "not stored yet"}</p>
                  <p className="mt-1">Realm ID: {initialQuickBooksSetup.realmId || "not connected yet"}</p>
                </div>
                {quickBooksHealth.summary ? <p className="text-sm font-medium text-emerald-700">{quickBooksHealth.summary}</p> : null}
                {quickBooksHealth.error ? <p className="text-sm font-medium text-rose-700">{quickBooksHealth.error}</p> : null}
                {quickBooksHealth.details?.length ? (
                  <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700">
                    {quickBooksHealth.details.map((detail) => (
                      <p key={detail} className="break-all">
                        {detail}
                      </p>
                    ))}
                  </div>
                ) : null}
              </span>
            </div>
            <div className={toggleCardClass}>
              <span className="w-full space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="block font-semibold text-slate-900">Zoho setup wizard</span>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${zohoStatus.tone}`}>
                    {zohoStatus.label}
                  </span>
                </div>
                <ol className="space-y-3 text-sm text-slate-600">
                  <li><span className="font-semibold text-slate-900">Step 1.</span> Select Zoho Invoice as the invoice provider. {invoiceProvider === "ZOHO" ? "Done." : "Pending."}</li>
                  <li><span className="font-semibold text-slate-900">Step 2.</span> Enter your Zoho app credentials below and save. {zohoCredsValid ? "Ready." : "Required fields missing."}</li>
                  <li><span className="font-semibold text-slate-900">Step 3.</span> Click Connect Zoho and complete consent. {zohoConnected ? "Connected." : "Pending."}</li>
                  <li><span className="font-semibold text-slate-900">Step 4.</span> Run Check Zoho to verify the token and organization.</li>
                </ol>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => connectProvider("zoho")} disabled={!zohoCanConnect} className="rounded-xl">
                    Connect Zoho
                  </Button>
                  <Button type="button" variant="outline" onClick={() => runHealthCheck("zoho")} disabled={zohoHealth.loading || !zohoCredsValid} className="rounded-xl">
                    {zohoHealth.loading ? "Checking..." : "Check Zoho"}
                  </Button>
                </div>
                {!zohoCanConnect ? (
                  <p className="text-xs text-slate-500">Enable Zoho as provider, enter client ID, client secret, redirect URI, accounts URL, and API base, then save before connecting.</p>
                ) : null}
                {zohoSavedButNotConnected ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-800">
                    Credentials are saved, but Zoho is not connected yet. Make sure the redirect URI below matches Zoho exactly, then click Connect Zoho.
                  </div>
                ) : null}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/85 px-4 py-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Connection details</p>
                  <p className="mt-1 break-all">Redirect URI: {zohoRedirectUri || `${browserBaseUrl}/api/integrations/zoho/callback`}</p>
                  <p className="mt-1 break-all">Accounts URL: {zohoAccountsBaseUrl || "not set"}</p>
                  <p className="mt-1 break-all">API base: {zohoApiBaseUrl || "not set"}</p>
                  <p className="mt-1">Refresh token: {initialZohoSetup.hasRefreshToken ? "stored" : "not stored yet"}</p>
                  <p className="mt-1">Organization ID: {zohoOrganizationId || "not selected yet"}</p>
                </div>
                {zohoHealth.summary ? <p className="text-sm font-medium text-emerald-700">{zohoHealth.summary}</p> : null}
                {zohoHealth.error ? <p className="text-sm font-medium text-rose-700">{zohoHealth.error}</p> : null}
                {zohoHealth.details?.length ? (
                  <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700">
                    {zohoHealth.details.map((detail) => (
                      <p key={detail} className="break-all">
                        {detail}
                      </p>
                    ))}
                  </div>
                ) : null}
              </span>
            </div>
          </div>
          {invoiceProvider === "ZOHO" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <label className={toggleCardClass}>
                <span className="w-full space-y-2">
                  <span className="block font-semibold text-slate-900">Zoho client ID</span>
                  <Input value={zohoClientId} onChange={(e) => setZohoClientId(e.target.value)} className={inputClass} />
                </span>
              </label>
              <label className={toggleCardClass}>
                <span className="w-full space-y-2">
                  <span className="block font-semibold text-slate-900">Zoho client secret</span>
                  <Input value={zohoClientSecret} onChange={(e) => setZohoClientSecret(e.target.value)} className={inputClass} />
                </span>
              </label>
              <label className={toggleCardClass}>
                <span className="w-full space-y-2">
                  <span className="block font-semibold text-slate-900">Zoho redirect URI</span>
                  <Input value={zohoRedirectUri} onChange={(e) => setZohoRedirectUri(e.target.value)} className={inputClass} />
                </span>
              </label>
              <label className={toggleCardClass}>
                <span className="w-full space-y-2">
                  <span className="block font-semibold text-slate-900">Zoho accounts URL</span>
                  <Input value={zohoAccountsBaseUrl} onChange={(e) => setZohoAccountsBaseUrl(e.target.value)} className={inputClass} />
                </span>
              </label>
              <label className={toggleCardClass}>
                <span className="w-full space-y-2">
                  <span className="block font-semibold text-slate-900">Zoho API base</span>
                  <Input value={zohoApiBaseUrl} onChange={(e) => setZohoApiBaseUrl(e.target.value)} className={inputClass} />
                </span>
              </label>
              <label className={toggleCardClass}>
                <span className="w-full space-y-2">
                  <span className="block font-semibold text-slate-900">{t("admin.settings.integrations.zohoOrganizationId")}</span>
                  <Input
                    value={zohoOrganizationId}
                    onChange={(e) => setZohoOrganizationId(e.target.value)}
                    className={inputClass}
                    placeholder="10234695"
                  />
                </span>
              </label>
              <label className={toggleCardClass}>
                <span className="w-full space-y-2">
                  <span className="block font-semibold text-slate-900">{t("admin.settings.integrations.zohoRefreshToken")}</span>
                  <Input
                    value={zohoRefreshToken}
                    onChange={(e) => setZohoRefreshToken(e.target.value)}
                    className={inputClass}
                    placeholder={initialZohoConfigured.hasRefreshToken ? "********" : ""}
                  />
                </span>
              </label>
            </div>
          ) : null}
          {invoiceProvider === "QUICKBOOKS" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <label className={toggleCardClass}>
                <span className="w-full space-y-2">
                  <span className="block font-semibold text-slate-900">QuickBooks client ID</span>
                  <Input value={quickBooksClientId} onChange={(e) => setQuickBooksClientId(e.target.value)} className={inputClass} />
                </span>
              </label>
              <label className={toggleCardClass}>
                <span className="w-full space-y-2">
                  <span className="block font-semibold text-slate-900">QuickBooks client secret</span>
                  <Input value={quickBooksClientSecret} onChange={(e) => setQuickBooksClientSecret(e.target.value)} className={inputClass} />
                </span>
              </label>
              <label className={toggleCardClass}>
                <span className="w-full space-y-2">
                  <span className="block font-semibold text-slate-900">QuickBooks redirect URI</span>
                  <Input value={quickBooksRedirectUri} onChange={(e) => setQuickBooksRedirectUri(e.target.value)} className={inputClass} />
                </span>
              </label>
              <label className={toggleCardClass}>
                <span className="w-full space-y-2">
                  <span className="block font-semibold text-slate-900">QuickBooks item ID</span>
                  <Input value={quickBooksItemId} onChange={(e) => setQuickBooksItemId(e.target.value)} className={inputClass} />
                </span>
              </label>
              <label className={toggleCardClass}>
                <span className="w-full space-y-2">
                  <span className="block font-semibold text-slate-900">QuickBooks environment</span>
                  <select
                    value={quickBooksEnvironment}
                    onChange={(e) => setQuickBooksEnvironment(e.target.value as "production" | "sandbox")}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-[0_10px_24px_-18px_rgba(12,74,160,0.2)] outline-none focus:ring-2 focus:ring-sky-200"
                  >
                    <option value="production">Production</option>
                    <option value="sandbox">Sandbox</option>
                  </select>
                </span>
              </label>
              <div className={toggleCardClass}>
                <span className="w-full space-y-2">
                  <span className="block font-semibold text-slate-900">{t("admin.settings.integrations.quickbooksControls")}</span>
                  <label className="flex items-center gap-3 text-sm text-slate-700">
                    <input type="checkbox" checked={quickBooksVisible} onChange={(e) => setQuickBooksVisible(e.target.checked)} />
                    <span>{t("admin.settings.integrations.showQuickbooks")}</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm text-slate-700">
                    <input type="checkbox" checked={quickBooksEnabled} onChange={(e) => setQuickBooksEnabled(e.target.checked)} />
                    <span>{t("admin.settings.integrations.allowQuickbooks")}</span>
                  </label>
                </span>
              </div>
            </div>
          ) : null}
          {!initialQuickBooks.envConfigured ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/85 px-4 py-3 text-sm text-amber-800 shadow-sm">
              {t("admin.settings.integrations.envWarning")}
            </div>
          ) : null}
          {invoiceProvider === "ZOHO" && !initialZohoConfigured.envConfigured ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/85 px-4 py-3 text-sm text-amber-800 shadow-sm">
              {t("admin.settings.integrations.zohoEnvWarning")}
            </div>
          ) : null}
        </div>
      </Card>

      <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex justify-end sm:bottom-5 sm:right-5">
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/94 px-4 py-3 shadow-[0_24px_50px_-26px_rgba(15,23,42,0.34)] backdrop-blur-md">
          <p className="hidden text-sm text-slate-600 xl:block">{t("admin.settings.subtitle")}</p>
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="min-w-[140px] rounded-xl bg-[rgb(19,120,152)] px-5 text-white shadow-[0_18px_34px_-20px_rgba(19,120,152,0.42)] hover:opacity-95"
          >
            {isSaving ? t("admin.settings.saving") : t("common.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

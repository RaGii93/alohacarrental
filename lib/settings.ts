import { db } from "@/lib/db";

const TAX_KEY = "tax_percentage";
const MIN_BOOKING_DAYS_KEY = "minimum_booking_days";
const BOOKING_HOLD_DAYS_KEY = "booking_hold_days";
const BELOW_MINIMUM_RENTAL_ADMIN_ONLY_KEY = "below_minimum_rental_admin_only";
const BELOW_MINIMUM_RENTAL_PRICING_ENABLED_KEY = "below_minimum_rental_pricing_enabled";
const BELOW_MINIMUM_RENTAL_SURCHARGE_MODE_KEY = "below_minimum_rental_surcharge_mode";
const BELOW_MINIMUM_RENTAL_SURCHARGE_VALUE_KEY = "below_minimum_rental_surcharge_value";
const LAST_MINUTE_BOOKING_ENABLED_KEY = "last_minute_booking_enabled";
const LAST_MINUTE_BOOKING_ADMIN_ONLY_KEY = "last_minute_booking_admin_only";
const LAST_MINUTE_BOOKING_THRESHOLD_HOURS_KEY = "last_minute_booking_threshold_hours";
const LAST_MINUTE_BOOKING_EXTRA_PERCENT_KEY = "last_minute_booking_extra_percent";
const MAINTENANCE_MODULE_ENABLED_KEY = "maintenance_module_enabled";
const INVENTORY_MODULE_ENABLED_KEY = "inventory_module_enabled";
const VEHICLE_FINANCIAL_TRACKING_ENABLED_KEY = "vehicle_financial_tracking_enabled";
const REMINDERS_MODULE_ENABLED_KEY = "reminders_module_enabled";
const DEFAULT_SMALL_SERVICE_INTERVAL_KM_KEY = "default_small_service_interval_km";
const DEFAULT_BIG_SERVICE_INTERVAL_KM_KEY = "default_big_service_interval_km";
const SERVICE_DUE_SOON_THRESHOLD_KM_KEY = "service_due_soon_threshold_km";
const ALLOW_CATEGORY_LEVEL_MAINTENANCE_TEMPLATES_KEY = "allow_category_level_maintenance_templates";
const ALLOW_VEHICLE_LEVEL_MAINTENANCE_OVERRIDES_KEY = "allow_vehicle_level_maintenance_overrides";
const VEHICLE_MAINTENANCE_AVAILABILITY_BLOCK_ENABLED_KEY = "vehicle_maintenance_availability_block_enabled";
const LOW_STOCK_THRESHOLD_ENABLED_KEY = "low_stock_threshold_enabled";
const DEFAULT_LOW_STOCK_THRESHOLD_KEY = "default_low_stock_threshold";
const INSURANCE_FEATURE_ENABLED_KEY = "insurance_feature_enabled";
const INSURANCE_REMINDER_ENABLED_KEY = "insurance_reminder_enabled";
const INSURANCE_REMINDER_DAYS_BEFORE_KEY = "insurance_reminder_days_before";
const INSURANCE_GRACE_PERIOD_DAYS_KEY = "insurance_grace_period_days";
const INSPECTION_FEATURE_ENABLED_KEY = "inspection_feature_enabled";
const INSPECTION_REMINDER_ENABLED_KEY = "inspection_reminder_enabled";
const INSPECTION_REMINDER_DAYS_BEFORE_KEY = "inspection_reminder_days_before";
const INSPECTION_GRACE_PERIOD_DAYS_KEY = "inspection_grace_period_days";
const INSPECTION_LABEL_KEY = "inspection_label";
const INSPECTION_LOCALIZED_LABEL_NL_KEY = "inspection_localized_label_nl";
const DASHBOARD_REMINDER_WIDGETS_ENABLED_KEY = "dashboard_reminder_widgets_enabled";
const REMINDER_SEVERITY_DUE_SOON_DAYS_KEY = "reminder_severity_due_soon_days";
const REMINDER_SEVERITY_DUE_SOON_KM_KEY = "reminder_severity_due_soon_km";
const BLOCK_VEHICLE_BOOKING_IF_INSURANCE_EXPIRED_KEY = "block_vehicle_booking_if_insurance_expired";
const BLOCK_VEHICLE_BOOKING_IF_INSPECTION_EXPIRED_KEY = "block_vehicle_booking_if_inspection_expired";
const BLOCK_VEHICLE_BOOKING_IF_MAINTENANCE_OVERDUE_KEY = "block_vehicle_booking_if_maintenance_overdue";
const VEHICLE_RATES_INCLUDE_TAX_KEY = "vehicle_rates_include_tax";
const QUICKBOOKS_REFRESH_TOKEN_KEY = "quickbooks_refresh_token";
const QUICKBOOKS_REALM_ID_KEY = "quickbooks_realm_id";
const QUICKBOOKS_CLIENT_ID_KEY = "quickbooks_client_id";
const QUICKBOOKS_CLIENT_SECRET_KEY = "quickbooks_client_secret";
const QUICKBOOKS_REDIRECT_URI_KEY = "quickbooks_redirect_uri";
const QUICKBOOKS_ENVIRONMENT_KEY = "quickbooks_environment";
const QUICKBOOKS_ITEM_ID_KEY = "quickbooks_item_id";
const TENANT_NAME_KEY = "tenant_name";
const TENANT_LOGO_URL_KEY = "tenant_logo_url";
const TENANT_PHONE_KEY = "tenant_phone";
const TENANT_WHATSAPP_KEY = "tenant_whatsapp";
const TENANT_WHATSAPP_URL_KEY = "tenant_whatsapp_url";
const TENANT_FACEBOOK_URL_KEY = "tenant_facebook_url";
const TENANT_INSTAGRAM_URL_KEY = "tenant_instagram_url";
const TENANT_LINKEDIN_URL_KEY = "tenant_linkedin_url";
const TENANT_TIKTOK_URL_KEY = "tenant_tiktok_url";
const TENANT_EMAIL_KEY = "tenant_email";
const TENANT_ADDRESS_KEY = "tenant_address";
const TENANT_CURRENCY_KEY = "tenant_currency";
const TENANT_PAYMENT_INSTRUCTIONS_KEY = "tenant_payment_instructions";
const TENANT_TERMS_PDF_URL_KEY = "tenant_terms_pdf_url";
const THEME_PRIMARY_KEY = "theme_primary";
const THEME_PRIMARY_FOREGROUND_KEY = "theme_primary_foreground";
const THEME_ACCENT_KEY = "theme_accent";
const THEME_ACCENT_FOREGROUND_KEY = "theme_accent_foreground";
const THEME_RING_KEY = "theme_ring";
const THEME_SIDEBAR_PRIMARY_KEY = "theme_sidebar_primary";
const THEME_SIDEBAR_PRIMARY_FOREGROUND_KEY = "theme_sidebar_primary_foreground";
const THEME_SIDEBAR_ACCENT_KEY = "theme_sidebar_accent";
const THEME_SIDEBAR_ACCENT_FOREGROUND_KEY = "theme_sidebar_accent_foreground";
const FEATURE_QUICKBOOKS_ENABLED_KEY = "feature_quickbooks_enabled";
const FEATURE_QUICKBOOKS_VISIBLE_KEY = "feature_quickbooks_visible";
const INVOICE_PROVIDER_KEY = "invoice_provider";
const ZOHO_INVOICE_ORGANIZATION_ID_KEY = "zoho_invoice_organization_id";
const ZOHO_INVOICE_REFRESH_TOKEN_KEY = "zoho_invoice_refresh_token";
const ZOHO_INVOICE_CLIENT_ID_KEY = "zoho_invoice_client_id";
const ZOHO_INVOICE_CLIENT_SECRET_KEY = "zoho_invoice_client_secret";
const ZOHO_INVOICE_REDIRECT_URI_KEY = "zoho_invoice_redirect_uri";
const ZOHO_INVOICE_ACCOUNTS_URL_KEY = "zoho_invoice_accounts_url";
const ZOHO_INVOICE_API_BASE_KEY = "zoho_invoice_api_base";

export type TenantThemeSettings = {
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  ring: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
};

export type TenantSettings = {
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
  theme: TenantThemeSettings;
};

export type QuickBooksFeatureSettings = {
  envEnabled: boolean;
  envConfigured: boolean;
  dbEnabled: boolean;
  dbVisible: boolean;
  enabled: boolean;
  visibleInAdmin: boolean;
};

export type QuickBooksSetupSettings = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: "production" | "sandbox";
  itemId: string;
  realmId: string;
  hasRefreshToken: boolean;
};

export type InvoiceProvider = "NONE" | "QUICKBOOKS" | "ZOHO";
export type BelowMinimumRentalSurchargeMode =
  | "percentage_on_base_total"
  | "percentage_on_current_total"
  | "fixed_amount";

export type BookingRuleSettings = {
  minimumRentalDays: number;
  belowMinimumRentalAdminOnly: boolean;
  belowMinimumRentalPricingEnabled: boolean;
  belowMinimumRentalSurchargeMode: BelowMinimumRentalSurchargeMode;
  belowMinimumRentalSurchargeValue: number;
  lastMinuteBookingEnabled: boolean;
  lastMinuteBookingAdminOnly: boolean;
  lastMinuteBookingThresholdHours: number;
  lastMinuteBookingExtraPercent: number;
};

export type FleetOperationsSettings = {
  maintenanceModuleEnabled: boolean;
  inventoryModuleEnabled: boolean;
  vehicleFinancialTrackingEnabled: boolean;
  remindersModuleEnabled: boolean;
  defaultSmallServiceIntervalKm: number;
  defaultBigServiceIntervalKm: number;
  serviceDueSoonThresholdKm?: number;
  allowCategoryLevelMaintenanceTemplates: boolean;
  allowVehicleLevelMaintenanceOverrides: boolean;
  vehicleMaintenanceAvailabilityBlockEnabled: boolean;
  lowStockThresholdEnabled: boolean;
  defaultLowStockThreshold: number;
  insuranceFeatureEnabled: boolean;
  insuranceReminderEnabled: boolean;
  insuranceReminderDaysBefore: number;
  insuranceGracePeriodDays?: number;
  inspectionFeatureEnabled: boolean;
  inspectionReminderEnabled: boolean;
  inspectionReminderDaysBefore: number;
  inspectionGracePeriodDays?: number;
  inspectionLabel: string;
  inspectionLocalizedLabelNl?: string;
  dashboardReminderWidgetsEnabled: boolean;
  reminderSeverityDueSoonDays?: number;
  reminderSeverityDueSoonKm?: number;
  blockVehicleBookingIfInsuranceExpired: boolean;
  blockVehicleBookingIfInspectionExpired: boolean;
  blockVehicleBookingIfMaintenanceOverdue: boolean;
};

export type ZohoInvoiceFeatureSettings = {
  envConfigured: boolean;
  hasRefreshToken: boolean;
  hasOrganizationId: boolean;
  enabled: boolean;
  visibleInAdmin: boolean;
  organizationId: string;
};

export type ZohoSetupSettings = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accountsBaseUrl: string;
  apiBaseUrl: string;
  organizationId: string;
  hasRefreshToken: boolean;
};

function parseBool(value: string | undefined, fallback = false) {
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function sanitizeOptionalText(value: string | null | undefined) {
  const normalized = String(value || "").trim();
  return normalized || undefined;
}

function sanitizeRequiredText(value: string | null | undefined, fallback: string) {
  return sanitizeOptionalText(value) || fallback;
}

function sanitizeHslToken(value: string | null | undefined, fallback: string) {
  return sanitizeOptionalText(value) || fallback;
}

function hexToRgb(hex: string) {
  const normalized = hex.trim().replace("#", "");
  const full = normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized;

  if (!/^[\da-fA-F]{6}$/.test(full)) return null;

  const value = parseInt(full, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHslToken(r: number, g: number, b: number) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;
  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));

    switch (max) {
      case red:
        hue = ((green - blue) / delta) % 6;
        break;
      case green:
        hue = (blue - red) / delta + 2;
        break;
      default:
        hue = (red - green) / delta + 4;
        break;
    }
  }

  const nextHue = Math.round(((hue * 60) + 360) % 360);
  const nextSaturation = Math.round(saturation * 100);
  const nextLightness = Math.round(lightness * 100);

  return `${nextHue} ${nextSaturation}% ${nextLightness}%`;
}

function primaryForegroundFor(lightToken: string) {
  const parts = lightToken.replace(/%/g, "").split(/\s+/).map(Number);
  const lightness = Number.isFinite(parts[2]) ? parts[2] : 50;
  return lightness > 60 ? "0 0% 9%" : "0 0% 98%";
}

function buildThemeFallbacks() {
  const primaryHex = sanitizeOptionalText(process.env.TENANT_PRIMARY_COLOR);
  const primaryFromHex = primaryHex ? hexToRgb(primaryHex) : null;
  const primary = primaryFromHex ? rgbToHslToken(primaryFromHex.r, primaryFromHex.g, primaryFromHex.b) : "294 64% 46%";
  const primaryForeground = primaryForegroundFor(primary);
  const accent = primaryFromHex ? `${primary.split(" ")[0]} 100% 97%` : "314 100% 97%";
  const accentForeground = primaryFromHex ? primary : "304 42% 24%";

  return {
    primary,
    primaryForeground,
    accent,
    accentForeground,
    ring: primary,
    sidebarPrimary: primary,
    sidebarPrimaryForeground: primaryForeground,
    sidebarAccent: accent,
    sidebarAccentForeground: accentForeground,
  };
}

function clampTaxPercentage(input: number): number {
  if (!Number.isFinite(input)) return 0;
  const clamped = Math.min(100, Math.max(0, input));
  return Math.round(clamped * 100) / 100;
}

function defaultTaxPercentage(): number {
  return clampTaxPercentage(Number(process.env.DEFAULT_TAX_PERCENTAGE || 0));
}

function defaultVehicleRatesIncludeTax(): boolean {
  return parseBool(process.env.DEFAULT_VEHICLE_RATES_INCLUDE_TAX, true);
}

function normalizeInvoiceProvider(value: string | null | undefined): InvoiceProvider {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === "QUICKBOOKS" || normalized === "ZOHO") return normalized;
  return "NONE";
}

function defaultInvoiceProvider(): InvoiceProvider {
  if (parseBool(process.env.QUICKBOOKS_ENABLED, false)) return "QUICKBOOKS";
  return "NONE";
}

function clampMinBookingDays(input: number): number {
  if (!Number.isFinite(input)) return 1;
  return Math.max(1, Math.min(365, Math.round(input)));
}

function defaultMinBookingDays(): number {
  return clampMinBookingDays(Number(process.env.DEFAULT_MIN_BOOKING_DAYS || 1));
}

function clampBookingHoldDays(input: number): number {
  if (!Number.isFinite(input)) return 1;
  return Math.max(1, Math.min(30, Math.round(input)));
}

function defaultBookingHoldDays(): number {
  return clampBookingHoldDays(Number(process.env.DEFAULT_BOOKING_HOLD_DAYS || 1));
}

function normalizeBelowMinimumRentalSurchargeMode(
  value: string | null | undefined
): BelowMinimumRentalSurchargeMode {
  const normalized = String(value || "").trim().toLowerCase();
  if (
    normalized === "percentage_on_base_total" ||
    normalized === "percentage_on_current_total" ||
    normalized === "fixed_amount"
  ) {
    return normalized;
  }
  return "percentage_on_base_total";
}

function clampPercentage(input: number): number {
  if (!Number.isFinite(input)) return 0;
  return Math.max(0, Math.min(1000, Math.round(input * 100) / 100));
}

function clampCurrencyAmount(input: number): number {
  if (!Number.isFinite(input)) return 0;
  return Math.max(0, Math.min(1_000_000, Math.round(input)));
}

function clampLastMinuteThresholdHours(input: number): number {
  if (!Number.isFinite(input)) return 24;
  return Math.max(1, Math.min(720, Math.round(input)));
}

function defaultBelowMinimumRentalAdminOnly(): boolean {
  return parseBool(process.env.DEFAULT_BELOW_MINIMUM_RENTAL_ADMIN_ONLY, true);
}

function defaultBelowMinimumRentalPricingEnabled(): boolean {
  return parseBool(process.env.DEFAULT_BELOW_MINIMUM_RENTAL_PRICING_ENABLED, false);
}

function defaultBelowMinimumRentalSurchargeMode(): BelowMinimumRentalSurchargeMode {
  return normalizeBelowMinimumRentalSurchargeMode(process.env.DEFAULT_BELOW_MINIMUM_RENTAL_SURCHARGE_MODE);
}

function defaultBelowMinimumRentalSurchargeValue(): number {
  return clampCurrencyAmount(Number(process.env.DEFAULT_BELOW_MINIMUM_RENTAL_SURCHARGE_VALUE || 0));
}

function defaultLastMinuteBookingEnabled(): boolean {
  return parseBool(process.env.DEFAULT_LAST_MINUTE_BOOKING_ENABLED, false);
}

function defaultLastMinuteBookingAdminOnly(): boolean {
  return parseBool(process.env.DEFAULT_LAST_MINUTE_BOOKING_ADMIN_ONLY, false);
}

function defaultLastMinuteBookingThresholdHours(): number {
  return clampLastMinuteThresholdHours(Number(process.env.DEFAULT_LAST_MINUTE_BOOKING_THRESHOLD_HOURS || 24));
}

function defaultLastMinuteBookingExtraPercent(): number {
  return clampPercentage(Number(process.env.DEFAULT_LAST_MINUTE_BOOKING_EXTRA_PERCENT || 0));
}

function clampDistanceKm(input: number, fallback = 0, max = 1_000_000): number {
  if (!Number.isFinite(input)) return fallback;
  return Math.max(0, Math.min(max, Math.round(input)));
}

function clampReminderDays(input: number, fallback = 0, max = 365): number {
  if (!Number.isFinite(input)) return fallback;
  return Math.max(0, Math.min(max, Math.round(input)));
}

function parseNullableInt(value: string | null | undefined, clamp: (value: number) => number): number | undefined {
  const trimmed = String(value || "").trim();
  if (!trimmed) return undefined;
  return clamp(Number(trimmed));
}

export function calculateTaxAmount(subtotalCents: number, taxPercentage: number): number {
  return Math.max(0, Math.round(Math.max(0, subtotalCents) * (clampTaxPercentage(taxPercentage) / 100)));
}

async function ensureSettingsTable(): Promise<void> {
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AppSetting" (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

export async function getAppSettingsMap(keys: string[]): Promise<Record<string, string>> {
  if (keys.length === 0) return {};
  await ensureSettingsTable();
  const rows = await db.appSetting.findMany({
    where: { key: { in: keys } },
    select: { key: true, value: true },
  });
  return Object.fromEntries(rows.map((row) => [row.key, String(row.value || "")]));
}

export async function getAppSettingValue(key: string): Promise<string> {
  await ensureSettingsTable();

  const rows = await db.$queryRaw<Array<{ value: string }>>`
    SELECT value FROM "AppSetting" WHERE key = ${key} LIMIT 1
  `;

  return String(rows[0]?.value || "");
}

export async function setAppSettingValue(key: string, value: string): Promise<void> {
  await ensureSettingsTable();

  await db.$executeRaw`
    INSERT INTO "AppSetting" (key, value, "updatedAt")
    VALUES (${key}, ${String(value || "")}, NOW())
    ON CONFLICT (key)
    DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()
  `;
}

export async function setAppSettingValues(values: Record<string, string | undefined>): Promise<void> {
  await ensureSettingsTable();
  const entries = Object.entries(values);
  await Promise.all(
    entries.map(([key, value]) =>
      db.$executeRaw`
        INSERT INTO "AppSetting" (key, value, "updatedAt")
        VALUES (${key}, ${String(value || "")}, NOW())
        ON CONFLICT (key)
        DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()
      `
    )
  );
}

export async function getTaxPercentage(): Promise<number> {
  const value = await getAppSettingValue(TAX_KEY);
  if (!value) return defaultTaxPercentage();
  return clampTaxPercentage(Number(value));
}

export async function setTaxPercentage(nextTaxPercentage: number): Promise<number> {
  await ensureSettingsTable();

  const normalized = clampTaxPercentage(nextTaxPercentage);
  await db.$executeRaw`
    INSERT INTO "AppSetting" (key, value, "updatedAt")
    VALUES (${TAX_KEY}, ${String(normalized)}, NOW())
    ON CONFLICT (key)
    DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()
  `;

  return normalized;
}

export async function getVehicleRatesIncludeTax(): Promise<boolean> {
  const value = await getAppSettingValue(VEHICLE_RATES_INCLUDE_TAX_KEY);
  if (!value) return defaultVehicleRatesIncludeTax();
  return parseBool(value, defaultVehicleRatesIncludeTax());
}

export async function setVehicleRatesIncludeTax(nextValue: boolean): Promise<boolean> {
  await ensureSettingsTable();

  const normalized = Boolean(nextValue);
  await db.$executeRaw`
    INSERT INTO "AppSetting" (key, value, "updatedAt")
    VALUES (${VEHICLE_RATES_INCLUDE_TAX_KEY}, ${normalized ? "true" : "false"}, NOW())
    ON CONFLICT (key)
    DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()
  `;

  return normalized;
}

export async function getInvoiceProvider(): Promise<InvoiceProvider> {
  const value = await getAppSettingValue(INVOICE_PROVIDER_KEY);
  if (!value) return defaultInvoiceProvider();
  return normalizeInvoiceProvider(value);
}

export async function setInvoiceProvider(nextValue: InvoiceProvider): Promise<InvoiceProvider> {
  const normalized = normalizeInvoiceProvider(nextValue);
  await setAppSettingValue(INVOICE_PROVIDER_KEY, normalized);
  return normalized;
}

export async function getMinBookingDays(): Promise<number> {
  const value = await getAppSettingValue(MIN_BOOKING_DAYS_KEY);
  if (!value) return defaultMinBookingDays();
  return clampMinBookingDays(Number(value));
}

export async function setMinBookingDays(nextMinBookingDays: number): Promise<number> {
  await ensureSettingsTable();

  const normalized = clampMinBookingDays(nextMinBookingDays);
  await db.$executeRaw`
    INSERT INTO "AppSetting" (key, value, "updatedAt")
    VALUES (${MIN_BOOKING_DAYS_KEY}, ${String(normalized)}, NOW())
    ON CONFLICT (key)
    DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()
  `;

  return normalized;
}

export async function getBookingHoldDays(): Promise<number> {
  const value = await getAppSettingValue(BOOKING_HOLD_DAYS_KEY);
  if (!value) return defaultBookingHoldDays();
  return clampBookingHoldDays(Number(value));
}

export async function setBookingHoldDays(nextBookingHoldDays: number): Promise<number> {
  await ensureSettingsTable();

  const normalized = clampBookingHoldDays(nextBookingHoldDays);
  await db.$executeRaw`
    INSERT INTO "AppSetting" (key, value, "updatedAt")
    VALUES (${BOOKING_HOLD_DAYS_KEY}, ${String(normalized)}, NOW())
    ON CONFLICT (key)
    DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()
  `;

  return normalized;
}

export async function getBookingRuleSettings(): Promise<BookingRuleSettings> {
  const values = await getAppSettingsMap([
    MIN_BOOKING_DAYS_KEY,
    BELOW_MINIMUM_RENTAL_ADMIN_ONLY_KEY,
    BELOW_MINIMUM_RENTAL_PRICING_ENABLED_KEY,
    BELOW_MINIMUM_RENTAL_SURCHARGE_MODE_KEY,
    BELOW_MINIMUM_RENTAL_SURCHARGE_VALUE_KEY,
    LAST_MINUTE_BOOKING_ENABLED_KEY,
    LAST_MINUTE_BOOKING_ADMIN_ONLY_KEY,
    LAST_MINUTE_BOOKING_THRESHOLD_HOURS_KEY,
    LAST_MINUTE_BOOKING_EXTRA_PERCENT_KEY,
  ]);

  return {
    minimumRentalDays: values[MIN_BOOKING_DAYS_KEY]
      ? clampMinBookingDays(Number(values[MIN_BOOKING_DAYS_KEY]))
      : defaultMinBookingDays(),
    belowMinimumRentalAdminOnly: values[BELOW_MINIMUM_RENTAL_ADMIN_ONLY_KEY]
      ? parseBool(values[BELOW_MINIMUM_RENTAL_ADMIN_ONLY_KEY], defaultBelowMinimumRentalAdminOnly())
      : defaultBelowMinimumRentalAdminOnly(),
    belowMinimumRentalPricingEnabled: values[BELOW_MINIMUM_RENTAL_PRICING_ENABLED_KEY]
      ? parseBool(values[BELOW_MINIMUM_RENTAL_PRICING_ENABLED_KEY], defaultBelowMinimumRentalPricingEnabled())
      : defaultBelowMinimumRentalPricingEnabled(),
    belowMinimumRentalSurchargeMode: values[BELOW_MINIMUM_RENTAL_SURCHARGE_MODE_KEY]
      ? normalizeBelowMinimumRentalSurchargeMode(values[BELOW_MINIMUM_RENTAL_SURCHARGE_MODE_KEY])
      : defaultBelowMinimumRentalSurchargeMode(),
    belowMinimumRentalSurchargeValue: values[BELOW_MINIMUM_RENTAL_SURCHARGE_VALUE_KEY]
      ? clampCurrencyAmount(Number(values[BELOW_MINIMUM_RENTAL_SURCHARGE_VALUE_KEY]))
      : defaultBelowMinimumRentalSurchargeValue(),
    lastMinuteBookingEnabled: values[LAST_MINUTE_BOOKING_ENABLED_KEY]
      ? parseBool(values[LAST_MINUTE_BOOKING_ENABLED_KEY], defaultLastMinuteBookingEnabled())
      : defaultLastMinuteBookingEnabled(),
    lastMinuteBookingAdminOnly: values[LAST_MINUTE_BOOKING_ADMIN_ONLY_KEY]
      ? parseBool(values[LAST_MINUTE_BOOKING_ADMIN_ONLY_KEY], defaultLastMinuteBookingAdminOnly())
      : defaultLastMinuteBookingAdminOnly(),
    lastMinuteBookingThresholdHours: values[LAST_MINUTE_BOOKING_THRESHOLD_HOURS_KEY]
      ? clampLastMinuteThresholdHours(Number(values[LAST_MINUTE_BOOKING_THRESHOLD_HOURS_KEY]))
      : defaultLastMinuteBookingThresholdHours(),
    lastMinuteBookingExtraPercent: values[LAST_MINUTE_BOOKING_EXTRA_PERCENT_KEY]
      ? clampPercentage(Number(values[LAST_MINUTE_BOOKING_EXTRA_PERCENT_KEY]))
      : defaultLastMinuteBookingExtraPercent(),
  };
}

export async function setBookingRuleSettings(input: BookingRuleSettings): Promise<BookingRuleSettings> {
  const normalized: BookingRuleSettings = {
    minimumRentalDays: clampMinBookingDays(input.minimumRentalDays),
    belowMinimumRentalAdminOnly: Boolean(input.belowMinimumRentalAdminOnly),
    belowMinimumRentalPricingEnabled: Boolean(input.belowMinimumRentalPricingEnabled),
    belowMinimumRentalSurchargeMode: normalizeBelowMinimumRentalSurchargeMode(input.belowMinimumRentalSurchargeMode),
    belowMinimumRentalSurchargeValue: clampCurrencyAmount(input.belowMinimumRentalSurchargeValue),
    lastMinuteBookingEnabled: Boolean(input.lastMinuteBookingEnabled),
    lastMinuteBookingAdminOnly: Boolean(input.lastMinuteBookingAdminOnly),
    lastMinuteBookingThresholdHours: clampLastMinuteThresholdHours(input.lastMinuteBookingThresholdHours),
    lastMinuteBookingExtraPercent: clampPercentage(input.lastMinuteBookingExtraPercent),
  };

  await setAppSettingValues({
    [MIN_BOOKING_DAYS_KEY]: String(normalized.minimumRentalDays),
    [BELOW_MINIMUM_RENTAL_ADMIN_ONLY_KEY]: normalized.belowMinimumRentalAdminOnly ? "true" : "false",
    [BELOW_MINIMUM_RENTAL_PRICING_ENABLED_KEY]: normalized.belowMinimumRentalPricingEnabled ? "true" : "false",
    [BELOW_MINIMUM_RENTAL_SURCHARGE_MODE_KEY]: normalized.belowMinimumRentalSurchargeMode,
    [BELOW_MINIMUM_RENTAL_SURCHARGE_VALUE_KEY]: String(normalized.belowMinimumRentalSurchargeValue),
    [LAST_MINUTE_BOOKING_ENABLED_KEY]: normalized.lastMinuteBookingEnabled ? "true" : "false",
    [LAST_MINUTE_BOOKING_ADMIN_ONLY_KEY]: normalized.lastMinuteBookingAdminOnly ? "true" : "false",
    [LAST_MINUTE_BOOKING_THRESHOLD_HOURS_KEY]: String(normalized.lastMinuteBookingThresholdHours),
    [LAST_MINUTE_BOOKING_EXTRA_PERCENT_KEY]: String(normalized.lastMinuteBookingExtraPercent),
  });

  return normalized;
}

export async function getFleetOperationsSettings(): Promise<FleetOperationsSettings> {
  const values = await getAppSettingsMap([
    MAINTENANCE_MODULE_ENABLED_KEY,
    INVENTORY_MODULE_ENABLED_KEY,
    VEHICLE_FINANCIAL_TRACKING_ENABLED_KEY,
    REMINDERS_MODULE_ENABLED_KEY,
    DEFAULT_SMALL_SERVICE_INTERVAL_KM_KEY,
    DEFAULT_BIG_SERVICE_INTERVAL_KM_KEY,
    SERVICE_DUE_SOON_THRESHOLD_KM_KEY,
    ALLOW_CATEGORY_LEVEL_MAINTENANCE_TEMPLATES_KEY,
    ALLOW_VEHICLE_LEVEL_MAINTENANCE_OVERRIDES_KEY,
    VEHICLE_MAINTENANCE_AVAILABILITY_BLOCK_ENABLED_KEY,
    LOW_STOCK_THRESHOLD_ENABLED_KEY,
    DEFAULT_LOW_STOCK_THRESHOLD_KEY,
    INSURANCE_FEATURE_ENABLED_KEY,
    INSURANCE_REMINDER_ENABLED_KEY,
    INSURANCE_REMINDER_DAYS_BEFORE_KEY,
    INSURANCE_GRACE_PERIOD_DAYS_KEY,
    INSPECTION_FEATURE_ENABLED_KEY,
    INSPECTION_REMINDER_ENABLED_KEY,
    INSPECTION_REMINDER_DAYS_BEFORE_KEY,
    INSPECTION_GRACE_PERIOD_DAYS_KEY,
    INSPECTION_LABEL_KEY,
    INSPECTION_LOCALIZED_LABEL_NL_KEY,
    DASHBOARD_REMINDER_WIDGETS_ENABLED_KEY,
    REMINDER_SEVERITY_DUE_SOON_DAYS_KEY,
    REMINDER_SEVERITY_DUE_SOON_KM_KEY,
    BLOCK_VEHICLE_BOOKING_IF_INSURANCE_EXPIRED_KEY,
    BLOCK_VEHICLE_BOOKING_IF_INSPECTION_EXPIRED_KEY,
    BLOCK_VEHICLE_BOOKING_IF_MAINTENANCE_OVERDUE_KEY,
  ]);

  return {
    maintenanceModuleEnabled: parseBool(values[MAINTENANCE_MODULE_ENABLED_KEY], true),
    inventoryModuleEnabled: parseBool(values[INVENTORY_MODULE_ENABLED_KEY], true),
    vehicleFinancialTrackingEnabled: parseBool(values[VEHICLE_FINANCIAL_TRACKING_ENABLED_KEY], true),
    remindersModuleEnabled: parseBool(values[REMINDERS_MODULE_ENABLED_KEY], true),
    defaultSmallServiceIntervalKm: clampDistanceKm(Number(values[DEFAULT_SMALL_SERVICE_INTERVAL_KM_KEY] || 5000), 5000),
    defaultBigServiceIntervalKm: clampDistanceKm(Number(values[DEFAULT_BIG_SERVICE_INTERVAL_KM_KEY] || 10000), 10000),
    serviceDueSoonThresholdKm: parseNullableInt(values[SERVICE_DUE_SOON_THRESHOLD_KM_KEY], (value) => clampDistanceKm(value, 0)),
    allowCategoryLevelMaintenanceTemplates: parseBool(values[ALLOW_CATEGORY_LEVEL_MAINTENANCE_TEMPLATES_KEY], true),
    allowVehicleLevelMaintenanceOverrides: parseBool(values[ALLOW_VEHICLE_LEVEL_MAINTENANCE_OVERRIDES_KEY], true),
    vehicleMaintenanceAvailabilityBlockEnabled: parseBool(values[VEHICLE_MAINTENANCE_AVAILABILITY_BLOCK_ENABLED_KEY], true),
    lowStockThresholdEnabled: parseBool(values[LOW_STOCK_THRESHOLD_ENABLED_KEY], true),
    defaultLowStockThreshold: clampDistanceKm(Number(values[DEFAULT_LOW_STOCK_THRESHOLD_KEY] || 2), 2, 100_000),
    insuranceFeatureEnabled: parseBool(values[INSURANCE_FEATURE_ENABLED_KEY], false),
    insuranceReminderEnabled: parseBool(values[INSURANCE_REMINDER_ENABLED_KEY], true),
    insuranceReminderDaysBefore: clampReminderDays(Number(values[INSURANCE_REMINDER_DAYS_BEFORE_KEY] || 14), 14),
    insuranceGracePeriodDays: parseNullableInt(values[INSURANCE_GRACE_PERIOD_DAYS_KEY], (value) => clampReminderDays(value, 0)),
    inspectionFeatureEnabled: parseBool(values[INSPECTION_FEATURE_ENABLED_KEY], false),
    inspectionReminderEnabled: parseBool(values[INSPECTION_REMINDER_ENABLED_KEY], true),
    inspectionReminderDaysBefore: clampReminderDays(Number(values[INSPECTION_REMINDER_DAYS_BEFORE_KEY] || 14), 14),
    inspectionGracePeriodDays: parseNullableInt(values[INSPECTION_GRACE_PERIOD_DAYS_KEY], (value) => clampReminderDays(value, 0)),
    inspectionLabel: String(values[INSPECTION_LABEL_KEY] || "Inspection").trim() || "Inspection",
    inspectionLocalizedLabelNl: sanitizeOptionalText(values[INSPECTION_LOCALIZED_LABEL_NL_KEY]) || "Keurings datum",
    dashboardReminderWidgetsEnabled: parseBool(values[DASHBOARD_REMINDER_WIDGETS_ENABLED_KEY], true),
    reminderSeverityDueSoonDays: parseNullableInt(values[REMINDER_SEVERITY_DUE_SOON_DAYS_KEY], (value) => clampReminderDays(value, 0)),
    reminderSeverityDueSoonKm: parseNullableInt(values[REMINDER_SEVERITY_DUE_SOON_KM_KEY], (value) => clampDistanceKm(value, 0)),
    blockVehicleBookingIfInsuranceExpired: parseBool(values[BLOCK_VEHICLE_BOOKING_IF_INSURANCE_EXPIRED_KEY], false),
    blockVehicleBookingIfInspectionExpired: parseBool(values[BLOCK_VEHICLE_BOOKING_IF_INSPECTION_EXPIRED_KEY], false),
    blockVehicleBookingIfMaintenanceOverdue: parseBool(values[BLOCK_VEHICLE_BOOKING_IF_MAINTENANCE_OVERDUE_KEY], false),
  };
}

export async function setFleetOperationsSettings(input: FleetOperationsSettings): Promise<FleetOperationsSettings> {
  const normalized: FleetOperationsSettings = {
    maintenanceModuleEnabled: Boolean(input.maintenanceModuleEnabled),
    inventoryModuleEnabled: Boolean(input.inventoryModuleEnabled),
    vehicleFinancialTrackingEnabled: Boolean(input.vehicleFinancialTrackingEnabled),
    remindersModuleEnabled: Boolean(input.remindersModuleEnabled),
    defaultSmallServiceIntervalKm: clampDistanceKm(input.defaultSmallServiceIntervalKm, 5000),
    defaultBigServiceIntervalKm: clampDistanceKm(input.defaultBigServiceIntervalKm, 10000),
    serviceDueSoonThresholdKm: input.serviceDueSoonThresholdKm === undefined ? undefined : clampDistanceKm(input.serviceDueSoonThresholdKm, 0),
    allowCategoryLevelMaintenanceTemplates: Boolean(input.allowCategoryLevelMaintenanceTemplates),
    allowVehicleLevelMaintenanceOverrides: Boolean(input.allowVehicleLevelMaintenanceOverrides),
    vehicleMaintenanceAvailabilityBlockEnabled: Boolean(input.vehicleMaintenanceAvailabilityBlockEnabled),
    lowStockThresholdEnabled: Boolean(input.lowStockThresholdEnabled),
    defaultLowStockThreshold: clampDistanceKm(input.defaultLowStockThreshold, 2, 100_000),
    insuranceFeatureEnabled: Boolean(input.insuranceFeatureEnabled),
    insuranceReminderEnabled: Boolean(input.insuranceReminderEnabled),
    insuranceReminderDaysBefore: clampReminderDays(input.insuranceReminderDaysBefore, 14),
    insuranceGracePeriodDays: input.insuranceGracePeriodDays === undefined ? undefined : clampReminderDays(input.insuranceGracePeriodDays, 0),
    inspectionFeatureEnabled: Boolean(input.inspectionFeatureEnabled),
    inspectionReminderEnabled: Boolean(input.inspectionReminderEnabled),
    inspectionReminderDaysBefore: clampReminderDays(input.inspectionReminderDaysBefore, 14),
    inspectionGracePeriodDays: input.inspectionGracePeriodDays === undefined ? undefined : clampReminderDays(input.inspectionGracePeriodDays, 0),
    inspectionLabel: sanitizeRequiredText(input.inspectionLabel, "Inspection"),
    inspectionLocalizedLabelNl: sanitizeOptionalText(input.inspectionLocalizedLabelNl) || "Keurings datum",
    dashboardReminderWidgetsEnabled: Boolean(input.dashboardReminderWidgetsEnabled),
    reminderSeverityDueSoonDays: input.reminderSeverityDueSoonDays === undefined ? undefined : clampReminderDays(input.reminderSeverityDueSoonDays, 0),
    reminderSeverityDueSoonKm: input.reminderSeverityDueSoonKm === undefined ? undefined : clampDistanceKm(input.reminderSeverityDueSoonKm, 0),
    blockVehicleBookingIfInsuranceExpired: Boolean(input.blockVehicleBookingIfInsuranceExpired),
    blockVehicleBookingIfInspectionExpired: Boolean(input.blockVehicleBookingIfInspectionExpired),
    blockVehicleBookingIfMaintenanceOverdue: Boolean(input.blockVehicleBookingIfMaintenanceOverdue),
  };

  await setAppSettingValues({
    [MAINTENANCE_MODULE_ENABLED_KEY]: normalized.maintenanceModuleEnabled ? "true" : "false",
    [INVENTORY_MODULE_ENABLED_KEY]: normalized.inventoryModuleEnabled ? "true" : "false",
    [VEHICLE_FINANCIAL_TRACKING_ENABLED_KEY]: normalized.vehicleFinancialTrackingEnabled ? "true" : "false",
    [REMINDERS_MODULE_ENABLED_KEY]: normalized.remindersModuleEnabled ? "true" : "false",
    [DEFAULT_SMALL_SERVICE_INTERVAL_KM_KEY]: String(normalized.defaultSmallServiceIntervalKm),
    [DEFAULT_BIG_SERVICE_INTERVAL_KM_KEY]: String(normalized.defaultBigServiceIntervalKm),
    [SERVICE_DUE_SOON_THRESHOLD_KM_KEY]: normalized.serviceDueSoonThresholdKm === undefined ? "" : String(normalized.serviceDueSoonThresholdKm),
    [ALLOW_CATEGORY_LEVEL_MAINTENANCE_TEMPLATES_KEY]: normalized.allowCategoryLevelMaintenanceTemplates ? "true" : "false",
    [ALLOW_VEHICLE_LEVEL_MAINTENANCE_OVERRIDES_KEY]: normalized.allowVehicleLevelMaintenanceOverrides ? "true" : "false",
    [VEHICLE_MAINTENANCE_AVAILABILITY_BLOCK_ENABLED_KEY]: normalized.vehicleMaintenanceAvailabilityBlockEnabled ? "true" : "false",
    [LOW_STOCK_THRESHOLD_ENABLED_KEY]: normalized.lowStockThresholdEnabled ? "true" : "false",
    [DEFAULT_LOW_STOCK_THRESHOLD_KEY]: String(normalized.defaultLowStockThreshold),
    [INSURANCE_FEATURE_ENABLED_KEY]: normalized.insuranceFeatureEnabled ? "true" : "false",
    [INSURANCE_REMINDER_ENABLED_KEY]: normalized.insuranceReminderEnabled ? "true" : "false",
    [INSURANCE_REMINDER_DAYS_BEFORE_KEY]: String(normalized.insuranceReminderDaysBefore),
    [INSURANCE_GRACE_PERIOD_DAYS_KEY]: normalized.insuranceGracePeriodDays === undefined ? "" : String(normalized.insuranceGracePeriodDays),
    [INSPECTION_FEATURE_ENABLED_KEY]: normalized.inspectionFeatureEnabled ? "true" : "false",
    [INSPECTION_REMINDER_ENABLED_KEY]: normalized.inspectionReminderEnabled ? "true" : "false",
    [INSPECTION_REMINDER_DAYS_BEFORE_KEY]: String(normalized.inspectionReminderDaysBefore),
    [INSPECTION_GRACE_PERIOD_DAYS_KEY]: normalized.inspectionGracePeriodDays === undefined ? "" : String(normalized.inspectionGracePeriodDays),
    [INSPECTION_LABEL_KEY]: normalized.inspectionLabel,
    [INSPECTION_LOCALIZED_LABEL_NL_KEY]: normalized.inspectionLocalizedLabelNl,
    [DASHBOARD_REMINDER_WIDGETS_ENABLED_KEY]: normalized.dashboardReminderWidgetsEnabled ? "true" : "false",
    [REMINDER_SEVERITY_DUE_SOON_DAYS_KEY]: normalized.reminderSeverityDueSoonDays === undefined ? "" : String(normalized.reminderSeverityDueSoonDays),
    [REMINDER_SEVERITY_DUE_SOON_KM_KEY]: normalized.reminderSeverityDueSoonKm === undefined ? "" : String(normalized.reminderSeverityDueSoonKm),
    [BLOCK_VEHICLE_BOOKING_IF_INSURANCE_EXPIRED_KEY]: normalized.blockVehicleBookingIfInsuranceExpired ? "true" : "false",
    [BLOCK_VEHICLE_BOOKING_IF_INSPECTION_EXPIRED_KEY]: normalized.blockVehicleBookingIfInspectionExpired ? "true" : "false",
    [BLOCK_VEHICLE_BOOKING_IF_MAINTENANCE_OVERDUE_KEY]: normalized.blockVehicleBookingIfMaintenanceOverdue ? "true" : "false",
  });

  return normalized;
}

export async function getQuickBooksRefreshToken(): Promise<string> {
  return String(await getAppSettingValue(QUICKBOOKS_REFRESH_TOKEN_KEY)).trim();
}

export async function setQuickBooksRefreshToken(refreshToken: string): Promise<void> {
  const normalized = String(refreshToken || "").trim();
  if (!normalized) return;
  await setAppSettingValue(QUICKBOOKS_REFRESH_TOKEN_KEY, normalized);
}

export async function getQuickBooksRealmId(): Promise<string> {
  return String(await getAppSettingValue(QUICKBOOKS_REALM_ID_KEY)).trim();
}

export async function setQuickBooksRealmId(realmId: string): Promise<void> {
  const normalized = String(realmId || "").trim();
  if (!normalized) return;
  await setAppSettingValue(QUICKBOOKS_REALM_ID_KEY, normalized);
}

export async function getQuickBooksSetupSettings(): Promise<QuickBooksSetupSettings> {
  const values = await getAppSettingsMap([
    QUICKBOOKS_CLIENT_ID_KEY,
    QUICKBOOKS_CLIENT_SECRET_KEY,
    QUICKBOOKS_REDIRECT_URI_KEY,
    QUICKBOOKS_ENVIRONMENT_KEY,
    QUICKBOOKS_ITEM_ID_KEY,
    QUICKBOOKS_REALM_ID_KEY,
    QUICKBOOKS_REFRESH_TOKEN_KEY,
  ]);
  const environment = String(values[QUICKBOOKS_ENVIRONMENT_KEY] || process.env.QUICKBOOKS_ENVIRONMENT || "production")
    .trim()
    .toLowerCase();
  return {
    clientId: String(values[QUICKBOOKS_CLIENT_ID_KEY] || process.env.QUICKBOOKS_CLIENT_ID || "").trim(),
    clientSecret: String(values[QUICKBOOKS_CLIENT_SECRET_KEY] || process.env.QUICKBOOKS_CLIENT_SECRET || "").trim(),
    redirectUri: String(values[QUICKBOOKS_REDIRECT_URI_KEY] || process.env.QUICKBOOKS_REDIRECT_URI || "").trim(),
    environment: environment === "sandbox" ? "sandbox" : "production",
    itemId: String(values[QUICKBOOKS_ITEM_ID_KEY] || process.env.QUICKBOOKS_ITEM_ID || "").trim(),
    realmId: String(values[QUICKBOOKS_REALM_ID_KEY] || process.env.QUICKBOOKS_REALM_ID || "").trim(),
    hasRefreshToken: Boolean(String(values[QUICKBOOKS_REFRESH_TOKEN_KEY] || process.env.QUICKBOOKS_REFRESH_TOKEN || "").trim()),
  };
}

export async function setQuickBooksSetupSettings(input: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: "production" | "sandbox";
  itemId: string;
}) {
  await setAppSettingValues({
    [QUICKBOOKS_CLIENT_ID_KEY]: input.clientId.trim(),
    [QUICKBOOKS_CLIENT_SECRET_KEY]: input.clientSecret.trim(),
    [QUICKBOOKS_REDIRECT_URI_KEY]: input.redirectUri.trim(),
    [QUICKBOOKS_ENVIRONMENT_KEY]: input.environment,
    [QUICKBOOKS_ITEM_ID_KEY]: input.itemId.trim(),
  });
  return await getQuickBooksSetupSettings();
}

export async function getZohoInvoiceRefreshToken(): Promise<string> {
  return String(await getAppSettingValue(ZOHO_INVOICE_REFRESH_TOKEN_KEY)).trim();
}

export async function setZohoInvoiceRefreshToken(refreshToken: string): Promise<void> {
  const normalized = String(refreshToken || "").trim();
  await setAppSettingValue(ZOHO_INVOICE_REFRESH_TOKEN_KEY, normalized);
}

export async function getZohoInvoiceOrganizationId(): Promise<string> {
  return String(await getAppSettingValue(ZOHO_INVOICE_ORGANIZATION_ID_KEY)).trim();
}

export async function setZohoInvoiceOrganizationId(organizationId: string): Promise<void> {
  const normalized = String(organizationId || "").trim();
  await setAppSettingValue(ZOHO_INVOICE_ORGANIZATION_ID_KEY, normalized);
}

export async function getZohoSetupSettings(): Promise<ZohoSetupSettings> {
  const values = await getAppSettingsMap([
    ZOHO_INVOICE_CLIENT_ID_KEY,
    ZOHO_INVOICE_CLIENT_SECRET_KEY,
    ZOHO_INVOICE_REDIRECT_URI_KEY,
    ZOHO_INVOICE_ACCOUNTS_URL_KEY,
    ZOHO_INVOICE_API_BASE_KEY,
    ZOHO_INVOICE_ORGANIZATION_ID_KEY,
    ZOHO_INVOICE_REFRESH_TOKEN_KEY,
  ]);
  return {
    clientId: String(values[ZOHO_INVOICE_CLIENT_ID_KEY] || process.env.ZOHO_INVOICE_CLIENT_ID || "").trim(),
    clientSecret: String(values[ZOHO_INVOICE_CLIENT_SECRET_KEY] || process.env.ZOHO_INVOICE_CLIENT_SECRET || "").trim(),
    redirectUri: String(values[ZOHO_INVOICE_REDIRECT_URI_KEY] || process.env.ZOHO_INVOICE_REDIRECT_URI || "").trim(),
    accountsBaseUrl: String(values[ZOHO_INVOICE_ACCOUNTS_URL_KEY] || process.env.ZOHO_INVOICE_ACCOUNTS_URL || "https://accounts.zoho.com").trim(),
    apiBaseUrl: String(values[ZOHO_INVOICE_API_BASE_KEY] || process.env.ZOHO_INVOICE_API_BASE || "https://www.zohoapis.com/invoice/v3").trim(),
    organizationId: String(values[ZOHO_INVOICE_ORGANIZATION_ID_KEY] || "").trim(),
    hasRefreshToken: Boolean(String(values[ZOHO_INVOICE_REFRESH_TOKEN_KEY] || "").trim()),
  };
}

export async function setZohoSetupSettings(input: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accountsBaseUrl: string;
  apiBaseUrl: string;
  organizationId: string;
}) {
  await setAppSettingValues({
    [ZOHO_INVOICE_CLIENT_ID_KEY]: input.clientId.trim(),
    [ZOHO_INVOICE_CLIENT_SECRET_KEY]: input.clientSecret.trim(),
    [ZOHO_INVOICE_REDIRECT_URI_KEY]: input.redirectUri.trim(),
    [ZOHO_INVOICE_ACCOUNTS_URL_KEY]: input.accountsBaseUrl.trim().replace(/\/+$/, ""),
    [ZOHO_INVOICE_API_BASE_KEY]: input.apiBaseUrl.trim().replace(/\/+$/, ""),
    [ZOHO_INVOICE_ORGANIZATION_ID_KEY]: input.organizationId.trim(),
  });
  return await getZohoSetupSettings();
}

export function getDefaultTenantSettings(): TenantSettings {
  const themeFallbacks = buildThemeFallbacks();
  const primary = sanitizeHslToken(process.env.TENANT_THEME_PRIMARY, themeFallbacks.primary);
  const primaryForeground = sanitizeHslToken(process.env.TENANT_THEME_PRIMARY_FOREGROUND, themeFallbacks.primaryForeground);
  const accent = sanitizeHslToken(process.env.TENANT_THEME_ACCENT, themeFallbacks.accent);
  const accentForeground = sanitizeHslToken(process.env.TENANT_THEME_ACCENT_FOREGROUND, themeFallbacks.accentForeground);
  const ring = sanitizeHslToken(process.env.TENANT_THEME_RING, themeFallbacks.ring);
  const sidebarPrimary = sanitizeHslToken(process.env.TENANT_THEME_SIDEBAR_PRIMARY, themeFallbacks.sidebarPrimary);
  const sidebarPrimaryForeground = sanitizeHslToken(
    process.env.TENANT_THEME_SIDEBAR_PRIMARY_FOREGROUND,
    themeFallbacks.sidebarPrimaryForeground
  );
  const sidebarAccent = sanitizeHslToken(process.env.TENANT_THEME_SIDEBAR_ACCENT, themeFallbacks.sidebarAccent);
  const sidebarAccentForeground = sanitizeHslToken(
    process.env.TENANT_THEME_SIDEBAR_ACCENT_FOREGROUND,
    themeFallbacks.sidebarAccentForeground
  );

  return {
    tenantName: sanitizeRequiredText(process.env.TENANT_NAME, "EdgeRent Lite"),
    logoUrl: sanitizeRequiredText(process.env.TENANT_LOGO_URL, "/logo.svg"),
    phone: sanitizeRequiredText(process.env.TENANT_PHONE, "+1 (555) 123-4567"),
    whatsapp: sanitizeRequiredText(process.env.TENANT_WHATSAPP, "+1 (555) 123-4567"),
    whatsappUrl: sanitizeOptionalText(process.env.TENANT_WHATSAPP_URL),
    facebookUrl: sanitizeOptionalText(process.env.TENANT_FACEBOOK_URL),
    instagramUrl: sanitizeOptionalText(process.env.TENANT_INSTAGRAM_URL),
    linkedinUrl: sanitizeOptionalText(process.env.TENANT_LINKEDIN_URL),
    tiktokUrl: sanitizeOptionalText(process.env.TENANT_TIKTOK_URL),
    email: sanitizeRequiredText(process.env.TENANT_EMAIL, "hello@example.com"),
    address: sanitizeRequiredText(process.env.TENANT_ADDRESS, "123 Main St, City, State 12345"),
    currency: sanitizeRequiredText(process.env.TENANT_CURRENCY, "USD"),
    paymentInstructions: sanitizeRequiredText(
      process.env.TENANT_PAYMENT_INSTRUCTIONS,
      "Payment via bank transfer or credit card. Please reference your booking ID."
    ),
    termsPdfUrl: sanitizeRequiredText(process.env.TENANT_TERMS_PDF_URL, "/terms.pdf"),
    theme: {
      primary,
      primaryForeground,
      accent,
      accentForeground,
      ring,
      sidebarPrimary,
      sidebarPrimaryForeground,
      sidebarAccent,
      sidebarAccentForeground,
    },
  };
}

export async function getTenantSettings(): Promise<TenantSettings> {
  const defaults = getDefaultTenantSettings();
  const values = await getAppSettingsMap([
    TENANT_NAME_KEY,
    TENANT_LOGO_URL_KEY,
    TENANT_PHONE_KEY,
    TENANT_WHATSAPP_KEY,
    TENANT_WHATSAPP_URL_KEY,
    TENANT_FACEBOOK_URL_KEY,
    TENANT_INSTAGRAM_URL_KEY,
    TENANT_LINKEDIN_URL_KEY,
    TENANT_TIKTOK_URL_KEY,
    TENANT_EMAIL_KEY,
    TENANT_ADDRESS_KEY,
    TENANT_CURRENCY_KEY,
    TENANT_PAYMENT_INSTRUCTIONS_KEY,
    TENANT_TERMS_PDF_URL_KEY,
    THEME_PRIMARY_KEY,
    THEME_PRIMARY_FOREGROUND_KEY,
    THEME_ACCENT_KEY,
    THEME_ACCENT_FOREGROUND_KEY,
    THEME_RING_KEY,
    THEME_SIDEBAR_PRIMARY_KEY,
    THEME_SIDEBAR_PRIMARY_FOREGROUND_KEY,
    THEME_SIDEBAR_ACCENT_KEY,
    THEME_SIDEBAR_ACCENT_FOREGROUND_KEY,
  ]);

  return {
    tenantName: sanitizeRequiredText(values[TENANT_NAME_KEY], defaults.tenantName),
    logoUrl: sanitizeRequiredText(values[TENANT_LOGO_URL_KEY], defaults.logoUrl),
    phone: sanitizeRequiredText(values[TENANT_PHONE_KEY], defaults.phone),
    whatsapp: sanitizeRequiredText(values[TENANT_WHATSAPP_KEY], defaults.whatsapp),
    whatsappUrl: sanitizeOptionalText(values[TENANT_WHATSAPP_URL_KEY]) || defaults.whatsappUrl,
    facebookUrl: sanitizeOptionalText(values[TENANT_FACEBOOK_URL_KEY]) || defaults.facebookUrl,
    instagramUrl: sanitizeOptionalText(values[TENANT_INSTAGRAM_URL_KEY]) || defaults.instagramUrl,
    linkedinUrl: sanitizeOptionalText(values[TENANT_LINKEDIN_URL_KEY]) || defaults.linkedinUrl,
    tiktokUrl: sanitizeOptionalText(values[TENANT_TIKTOK_URL_KEY]) || defaults.tiktokUrl,
    email: sanitizeRequiredText(values[TENANT_EMAIL_KEY], defaults.email),
    address: sanitizeRequiredText(values[TENANT_ADDRESS_KEY], defaults.address),
    currency: sanitizeRequiredText(values[TENANT_CURRENCY_KEY], defaults.currency),
    paymentInstructions: sanitizeRequiredText(values[TENANT_PAYMENT_INSTRUCTIONS_KEY], defaults.paymentInstructions),
    termsPdfUrl: sanitizeRequiredText(values[TENANT_TERMS_PDF_URL_KEY], defaults.termsPdfUrl),
    theme: {
      primary: sanitizeHslToken(values[THEME_PRIMARY_KEY], defaults.theme.primary),
      primaryForeground: sanitizeHslToken(values[THEME_PRIMARY_FOREGROUND_KEY], defaults.theme.primaryForeground),
      accent: sanitizeHslToken(values[THEME_ACCENT_KEY], defaults.theme.accent),
      accentForeground: sanitizeHslToken(values[THEME_ACCENT_FOREGROUND_KEY], defaults.theme.accentForeground),
      ring: sanitizeHslToken(values[THEME_RING_KEY], defaults.theme.ring),
      sidebarPrimary: sanitizeHslToken(values[THEME_SIDEBAR_PRIMARY_KEY], defaults.theme.sidebarPrimary),
      sidebarPrimaryForeground: sanitizeHslToken(
        values[THEME_SIDEBAR_PRIMARY_FOREGROUND_KEY],
        defaults.theme.sidebarPrimaryForeground
      ),
      sidebarAccent: sanitizeHslToken(values[THEME_SIDEBAR_ACCENT_KEY], defaults.theme.sidebarAccent),
      sidebarAccentForeground: sanitizeHslToken(
        values[THEME_SIDEBAR_ACCENT_FOREGROUND_KEY],
        defaults.theme.sidebarAccentForeground
      ),
    },
  };
}

export async function setTenantSettings(input: Partial<TenantSettings>): Promise<TenantSettings> {
  const current = await getTenantSettings();
  const next: TenantSettings = {
    ...current,
    ...input,
    theme: {
      ...current.theme,
      ...(input.theme || {}),
    },
  };

  await setAppSettingValues({
    [TENANT_NAME_KEY]: next.tenantName,
    [TENANT_LOGO_URL_KEY]: next.logoUrl,
    [TENANT_PHONE_KEY]: next.phone,
    [TENANT_WHATSAPP_KEY]: next.whatsapp,
    [TENANT_WHATSAPP_URL_KEY]: next.whatsappUrl,
    [TENANT_FACEBOOK_URL_KEY]: next.facebookUrl,
    [TENANT_INSTAGRAM_URL_KEY]: next.instagramUrl,
    [TENANT_LINKEDIN_URL_KEY]: next.linkedinUrl,
    [TENANT_TIKTOK_URL_KEY]: next.tiktokUrl,
    [TENANT_EMAIL_KEY]: next.email,
    [TENANT_ADDRESS_KEY]: next.address,
    [TENANT_CURRENCY_KEY]: next.currency,
    [TENANT_PAYMENT_INSTRUCTIONS_KEY]: next.paymentInstructions,
    [TENANT_TERMS_PDF_URL_KEY]: next.termsPdfUrl,
    [THEME_PRIMARY_KEY]: next.theme.primary,
    [THEME_PRIMARY_FOREGROUND_KEY]: next.theme.primaryForeground,
    [THEME_ACCENT_KEY]: next.theme.accent,
    [THEME_ACCENT_FOREGROUND_KEY]: next.theme.accentForeground,
    [THEME_RING_KEY]: next.theme.ring,
    [THEME_SIDEBAR_PRIMARY_KEY]: next.theme.sidebarPrimary,
    [THEME_SIDEBAR_PRIMARY_FOREGROUND_KEY]: next.theme.sidebarPrimaryForeground,
    [THEME_SIDEBAR_ACCENT_KEY]: next.theme.sidebarAccent,
    [THEME_SIDEBAR_ACCENT_FOREGROUND_KEY]: next.theme.sidebarAccentForeground,
  });

  return next;
}

export function getDefaultQuickBooksFeatureSettings(): QuickBooksFeatureSettings {
  const envEnabled = parseBool(process.env.QUICKBOOKS_ENABLED, false);
  const envConfigured = Boolean(
    process.env.QUICKBOOKS_CLIENT_ID &&
      process.env.QUICKBOOKS_CLIENT_SECRET
  );

  return {
    envEnabled,
    envConfigured,
    dbEnabled: envEnabled,
    dbVisible: envEnabled,
    enabled: envEnabled,
    visibleInAdmin: envEnabled,
  };
}

export async function getQuickBooksFeatureSettings(): Promise<QuickBooksFeatureSettings> {
  const defaults = getDefaultQuickBooksFeatureSettings();
  const values = await getAppSettingsMap([FEATURE_QUICKBOOKS_ENABLED_KEY, FEATURE_QUICKBOOKS_VISIBLE_KEY]);
  const invoiceProvider = await getInvoiceProvider();
  const setup = await getQuickBooksSetupSettings();
  const dbEnabled = parseBool(values[FEATURE_QUICKBOOKS_ENABLED_KEY], defaults.dbEnabled);
  const dbVisible = parseBool(values[FEATURE_QUICKBOOKS_VISIBLE_KEY], defaults.dbVisible);
  const capabilityAvailable = defaults.envConfigured || Boolean(setup.clientId && setup.clientSecret);

  return {
    envEnabled: defaults.envEnabled || capabilityAvailable,
    envConfigured: capabilityAvailable,
    dbEnabled,
    dbVisible,
    enabled: capabilityAvailable && dbEnabled && invoiceProvider === "QUICKBOOKS",
    visibleInAdmin: dbVisible && invoiceProvider === "QUICKBOOKS",
  };
}

export async function setQuickBooksFeatureSettings(input: Pick<QuickBooksFeatureSettings, "dbEnabled" | "dbVisible">) {
  await setAppSettingValues({
    [FEATURE_QUICKBOOKS_ENABLED_KEY]: input.dbEnabled ? "true" : "false",
    [FEATURE_QUICKBOOKS_VISIBLE_KEY]: input.dbVisible ? "true" : "false",
  });
  return await getQuickBooksFeatureSettings();
}

export async function getZohoInvoiceFeatureSettings(): Promise<ZohoInvoiceFeatureSettings> {
  const invoiceProvider = await getInvoiceProvider();
  const [organizationId, refreshToken, setup] = await Promise.all([
    getZohoInvoiceOrganizationId(),
    getZohoInvoiceRefreshToken(),
    getZohoSetupSettings(),
  ]);
  const envConfigured = Boolean(
    (process.env.ZOHO_INVOICE_CLIENT_ID && process.env.ZOHO_INVOICE_CLIENT_SECRET) ||
      (setup.clientId && setup.clientSecret)
  );

  return {
    envConfigured,
    hasRefreshToken: Boolean(refreshToken),
    hasOrganizationId: Boolean(organizationId),
    enabled: invoiceProvider === "ZOHO" && envConfigured && Boolean(refreshToken) && Boolean(organizationId),
    visibleInAdmin: invoiceProvider === "ZOHO",
    organizationId,
  };
}

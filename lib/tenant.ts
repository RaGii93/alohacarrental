export interface TenantConfig {
  tenantName: string;
  logoUrl: string;
  primaryColor: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  currency: string;
  paymentInstructions: string;
}

export const defaultTenantConfig: TenantConfig = {
  tenantName: process.env.TENANT_NAME || "EdgeRent Lite",
  logoUrl: process.env.TENANT_LOGO_URL || "/logo.svg",
  primaryColor: process.env.TENANT_PRIMARY_COLOR || "#2563eb",
  phone: process.env.TENANT_PHONE || "+1 (555) 123-4567",
  whatsapp: process.env.TENANT_WHATSAPP || "+1 (555) 123-4567",
  email: process.env.TENANT_EMAIL || "contact@edgerent.com",
  address: process.env.TENANT_ADDRESS || "123 Main St, City, State 12345",
  currency: process.env.TENANT_CURRENCY || "USD",
  paymentInstructions:
    process.env.TENANT_PAYMENT_INSTRUCTIONS ||
    "Payment via bank transfer or credit card. Please reference your booking ID.",
};

export function getTenantConfig(): TenantConfig {
  return defaultTenantConfig;
}

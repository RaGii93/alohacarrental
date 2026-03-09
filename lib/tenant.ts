export interface TenantConfig {
  tenantName: string;
  logoUrl: string;
  primaryColor: string;
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
}

export const defaultTenantConfig: TenantConfig = {
  tenantName: process.env.TENANT_NAME || "Aloha Car Rental",
  logoUrl: process.env.TENANT_LOGO_URL || "/logo.svg",
  primaryColor: process.env.TENANT_PRIMARY_COLOR || "#2563eb",
  phone: process.env.TENANT_PHONE || "+1 (555) 123-4567",
  whatsapp: process.env.TENANT_WHATSAPP || "+1 (555) 123-4567",
  whatsappUrl: process.env.TENANT_WHATSAPP_URL || undefined,
  facebookUrl: process.env.TENANT_FACEBOOK_URL || undefined,
  instagramUrl: process.env.TENANT_INSTAGRAM_URL || undefined,
  linkedinUrl: process.env.TENANT_LINKEDIN_URL || undefined,
  tiktokUrl: process.env.TENANT_TIKTOK_URL || undefined,
  email: process.env.TENANT_EMAIL || "rademier.streden@outlook.com",
  address: process.env.TENANT_ADDRESS || "123 Main St, City, State 12345",
  currency: process.env.TENANT_CURRENCY || "USD",
  paymentInstructions:
    process.env.TENANT_PAYMENT_INSTRUCTIONS ||
    "Payment via bank transfer or credit card. Please reference your booking ID.",
  termsPdfUrl: process.env.TENANT_TERMS_PDF_URL || "/terms.pdf",
};

export function getTenantConfig(): TenantConfig {
  return defaultTenantConfig;
}

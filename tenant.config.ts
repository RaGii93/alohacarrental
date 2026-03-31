import { TenantConfig } from "@/lib/tenant";

/**
 * Tenant Configuration
 * Customize this for your specific client.
 * For multi-client deployment, override values via environment variables.
 */
export const tenantConfig: TenantConfig = {
  tenantName: process.env.TENANT_NAME || "Aloha Car Rental",
  logoUrl: process.env.TENANT_LOGO_URL || "/logo.svg",
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
    "Please pay via bank transfer using your booking reference as the transaction reference.",
  termsPdfUrl: process.env.TENANT_TERMS_PDF_URL || "/terms.pdf",
  theme: {
    primary: process.env.TENANT_THEME_PRIMARY || "294 64% 46%",
    primaryForeground: process.env.TENANT_THEME_PRIMARY_FOREGROUND || "0 0% 98%",
    accent: process.env.TENANT_THEME_ACCENT || "314 100% 97%",
    accentForeground: process.env.TENANT_THEME_ACCENT_FOREGROUND || "304 42% 24%",
    ring: process.env.TENANT_THEME_RING || "294 64% 46%",
    sidebarPrimary: process.env.TENANT_THEME_SIDEBAR_PRIMARY || "294 64% 46%",
    sidebarPrimaryForeground: process.env.TENANT_THEME_SIDEBAR_PRIMARY_FOREGROUND || "0 0% 98%",
    sidebarAccent: process.env.TENANT_THEME_SIDEBAR_ACCENT || "314 100% 97%",
    sidebarAccentForeground: process.env.TENANT_THEME_SIDEBAR_ACCENT_FOREGROUND || "304 42% 24%",
  },
};

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guards";
import { isLicenseActive } from "@/lib/license";

export const DEFAULT_ADMIN_PAGE_SIZE = 20;
export const ADMIN_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export function toPositiveInt(value: string | undefined, fallback = 1) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function toPageSize(value: string | undefined) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) return DEFAULT_ADMIN_PAGE_SIZE;
  return (ADMIN_PAGE_SIZE_OPTIONS as readonly number[]).includes(parsed) ? parsed : DEFAULT_ADMIN_PAGE_SIZE;
}

export async function requireLicensedAdmin(locale: string) {
  const admin = await requireAdmin(locale);
  const licenseActive = isLicenseActive();
  if (!licenseActive && admin.role !== "ROOT") {
    redirect(`/${locale}/admin/billing-required`);
  }
  return { admin, licenseActive };
}

const STAFF_ALLOWED_SECTIONS = new Set(["bookings", "deliveries", "returns", "fleet"]);

export function canAccessAdminSection(role: string, section: string) {
  if (role === "ROOT" || role === "OWNER") return true;
  if (role === "STAFF") return STAFF_ALLOWED_SECTIONS.has(section);
  return false;
}

export async function requireAdminSection(locale: string, section: string) {
  const auth = await requireLicensedAdmin(locale);
  if (!canAccessAdminSection(auth.admin.role, section)) {
    redirect(`/${locale}/admin/bookings`);
  }
  return auth;
}

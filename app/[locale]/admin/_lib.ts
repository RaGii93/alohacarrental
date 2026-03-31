import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guards";
import { isLicenseActive } from "@/lib/license";

export const DEFAULT_ADMIN_PAGE_SIZE = 20;
export const ADMIN_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const ADMIN_PAGE_SHELL = "w-full px-4 py-8 sm:px-6 lg:px-8";
export const ADMIN_PAGE_STACK = "space-y-6";
export const ADMIN_PAGE_KICKER = "text-sm font-medium text-[hsl(var(--foreground)/0.78)]";
export const ADMIN_PAGE_META_ROW = "flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between";
export const ADMIN_PAGE_META_TEXT = "font-medium text-[hsl(var(--foreground)/0.72)]";
export const ADMIN_PAGE_ROWS_WRAP = "flex items-center gap-2";
export const ADMIN_PAGE_ROWS_BUTTON = "inline-flex h-9 items-center rounded-xl border px-3 text-xs transition-colors";
export const ADMIN_PAGE_ROWS_BUTTON_ACTIVE = "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] font-semibold text-[hsl(var(--primary))]";
export const ADMIN_PAGE_ROWS_BUTTON_IDLE = "border-[hsl(var(--border))] bg-white text-[hsl(var(--foreground)/0.75)] hover:bg-[hsl(var(--secondary))]";
export const ADMIN_PAGE_PAGER = "flex items-center justify-end gap-2";
export const ADMIN_PAGE_PAGER_BUTTON = "inline-flex h-9 items-center rounded-xl border border-[hsl(var(--border))] bg-white px-3 text-xs text-[hsl(var(--foreground)/0.78)] hover:bg-[hsl(var(--secondary))]";
export const ADMIN_PAGE_PAGER_DISABLED = "inline-flex h-9 items-center rounded-xl border border-[hsl(var(--border))] bg-white px-3 text-xs opacity-50";
export const ADMIN_PAGE_PAGER_CURRENT = "inline-flex h-9 items-center rounded-xl border border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] px-3 text-xs font-semibold text-[hsl(var(--primary))]";

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

const STAFF_ALLOWED_SECTIONS = new Set(["bookings", "deliveries", "returns", "fleet", "help", "notifications"]);

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

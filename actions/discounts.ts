"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isLicenseActive } from "@/lib/license";

async function requireAdmin() {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Unauthorized" };
  if (!isLicenseActive() && session.role !== "ROOT") return { ok: false as const, error: "BOOKING_DISABLED" };
  return { ok: true as const, session };
}

function parsePayload(input: any) {
  return {
    code: String(input?.code || "").trim().toUpperCase(),
    description: input?.description ? String(input.description) : null,
    percentage: Math.max(1, Math.min(100, Math.round(Number(input?.percentage || 0)))),
    isActive: input?.isActive !== false,
    maxUses: input?.maxUses ? Math.max(1, Math.round(Number(input.maxUses))) : null,
    expiresAt: input?.expiresAt ? new Date(input.expiresAt) : null,
  };
}

export async function createDiscountCodeAction(formData: any, locale: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const payload = parsePayload(formData);
    if (payload.code.length < 3) return { success: false, error: "Invalid code" };
    const discount = await db.discountCode.create({ data: payload as any });
    await db.auditLog.create({ data: { adminUserId: auth.session.adminUserId, action: "DISCOUNT_CREATED" } });
    return { success: true, discount };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create discount code" };
  }
}

export async function updateDiscountCodeAction(discountCodeId: string, formData: any, locale: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const payload = parsePayload(formData);
    const discount = await db.discountCode.update({ where: { id: discountCodeId }, data: payload as any });
    await db.auditLog.create({ data: { adminUserId: auth.session.adminUserId, action: "DISCOUNT_UPDATED" } });
    return { success: true, discount };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update discount code" };
  }
}

export async function deactivateDiscountCodeAction(discountCodeId: string, locale: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const discount = await db.discountCode.update({ where: { id: discountCodeId }, data: { isActive: false } });
    await db.auditLog.create({ data: { adminUserId: auth.session.adminUserId, action: "DISCOUNT_DEACTIVATED" } });
    return { success: true, discount };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to deactivate discount code" };
  }
}

"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isLicenseActive } from "@/lib/license";

function parsePayload(input: any) {
  return {
    name: String(input?.name || "").trim(),
    description: input?.description ? String(input.description) : null,
    pricingType: input?.pricingType === "DAILY" ? "DAILY" : "FLAT",
    amount: Math.max(0, Math.round(Number(input?.amount || 0) * 100)),
    isActive: input?.isActive !== false,
  } as const;
}

async function requireAdmin() {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Unauthorized" };
  if (!isLicenseActive() && session.role !== "ROOT") return { ok: false as const, error: "BOOKING_DISABLED" };
  return { ok: true as const, session };
}

export async function createExtraAction(formData: any, locale: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const payload = parsePayload(formData);
    if (payload.name.length < 2 || payload.amount <= 0) return { success: false, error: "Invalid input" };
    const extra = await db.extra.create({ data: payload as any });
    await db.auditLog.create({ data: { adminUserId: auth.session.adminUserId, action: "EXTRA_CREATED" } });
    return { success: true, extra };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create extra" };
  }
}

export async function updateExtraAction(extraId: string, formData: any, locale: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const payload = parsePayload(formData);
    const extra = await db.extra.update({ where: { id: extraId }, data: payload as any });
    await db.auditLog.create({ data: { adminUserId: auth.session.adminUserId, action: "EXTRA_UPDATED" } });
    return { success: true, extra };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update extra" };
  }
}

export async function archiveExtraAction(extraId: string, locale: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return { success: false, error: auth.error };
  try {
    const extra = await db.extra.update({ where: { id: extraId }, data: { isActive: false } });
    await db.auditLog.create({ data: { adminUserId: auth.session.adminUserId, action: "EXTRA_ARCHIVED" } });
    return { success: true, extra };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to archive extra" };
  }
}

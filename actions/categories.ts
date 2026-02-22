"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isLicenseActive } from "@/lib/license";
import { categoryFormSchema } from "@/lib/validators";

async function assertAdmin() {
  const session = await getSession();
  if (!session) {
    return { ok: false as const, error: "Unauthorized" };
  }
  if (!isLicenseActive() && session.role !== "ROOT") {
    return { ok: false as const, error: "BOOKING_DISABLED" };
  }
  return { ok: true as const, session };
}

export async function createCategoryAction(formData: any, locale: string) {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  try {
    const validated = categoryFormSchema.parse(formData);
    const created = await db.vehicleCategory.create({
      data: {
        name: validated.name,
        description: validated.description || null,
        dailyRate: Math.round(validated.dailyRate * 100),
        sortOrder: validated.sortOrder,
        isActive: validated.isActive,
      },
    });
    await db.auditLog.create({
      data: {
        adminUserId: auth.session.adminUserId,
        action: "CATEGORY_CREATED",
      },
    });
    return { success: true, category: created };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create category" };
  }
}

export async function updateCategoryAction(categoryId: string, formData: any, locale: string) {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  try {
    const validated = categoryFormSchema.parse(formData);
    const updated = await db.vehicleCategory.update({
      where: { id: categoryId },
      data: {
        name: validated.name,
        description: validated.description || null,
        dailyRate: Math.round(validated.dailyRate * 100),
        sortOrder: validated.sortOrder,
        isActive: validated.isActive,
      },
    });
    await db.auditLog.create({
      data: {
        adminUserId: auth.session.adminUserId,
        action: "CATEGORY_UPDATED",
      },
    });
    return { success: true, category: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update category" };
  }
}

export async function archiveCategoryAction(categoryId: string, locale: string) {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  try {
    const updated = await db.vehicleCategory.update({
      where: { id: categoryId },
      data: { isActive: false },
    });
    await db.auditLog.create({
      data: {
        adminUserId: auth.session.adminUserId,
        action: "CATEGORY_ARCHIVED",
      },
    });
    return { success: true, category: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to archive category" };
  }
}

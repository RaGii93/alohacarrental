"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isLicenseActive } from "@/lib/license";
import { categoryFormSchema } from "@/lib/validators";
import { uploadFile } from "@/lib/uploads";
import { logAdminAction } from "@/lib/audit";

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
        imageUrl: validated.imageUrl || null,
        seats: validated.seats,
        transmission: validated.transmission,
        hasAC: validated.hasAC,
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
        imageUrl: validated.imageUrl || null,
        seats: validated.seats,
        transmission: validated.transmission,
        hasAC: validated.hasAC,
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

export async function uploadCategoryImageAction(formData: FormData) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    const file = formData.get("image") as File | null;
    if (!file || file.size === 0) {
      return { success: false, error: "No file provided" };
    }
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      return { success: false, error: "Only JPG and PNG files are allowed" };
    }

    const upload = await uploadFile(file, "categories");
    if (!upload.success || !upload.url) {
      return { success: false, error: upload.error || "Failed to upload image" };
    }
    await logAdminAction({
      adminUserId: auth.session.adminUserId,
      action: "CATEGORY_IMAGE_UPLOADED",
    });

    return { success: true, imageUrl: upload.url };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to upload image" };
  }
}

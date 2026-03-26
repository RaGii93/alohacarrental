"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isLicenseActive } from "@/lib/license";
import { vehicleFeatureSlugFromName } from "@/lib/vehicle-features";

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

function normalizePayload(input: { name?: string; sortOrder?: number; isActive?: boolean }) {
  const name = (input.name || "").trim().replace(/\s+/g, " ");
  if (name.length < 2) {
    throw new Error("Feature name must be at least 2 characters");
  }

  return {
    name,
    slug: vehicleFeatureSlugFromName(name),
    sortOrder: Number.isFinite(input.sortOrder) ? Math.max(0, Math.trunc(input.sortOrder as number)) : 0,
    isActive: input.isActive ?? true,
  };
}

export async function createVehicleFeatureAction(input: { name?: string; sortOrder?: number; isActive?: boolean }) {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  try {
    const payload = normalizePayload(input);
    const feature = await db.vehicleFeature.create({ data: payload });
    await db.auditLog.create({
      data: {
        adminUserId: auth.session.adminUserId,
        action: "VEHICLE_FEATURE_CREATED",
      },
    });
    return { success: true, feature };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create feature" };
  }
}

export async function updateVehicleFeatureAction(
  featureId: string,
  input: { name?: string; sortOrder?: number; isActive?: boolean }
) {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  try {
    const payload = normalizePayload(input);
    const feature = await db.vehicleFeature.update({
      where: { id: featureId },
      data: payload,
    });
    await db.auditLog.create({
      data: {
        adminUserId: auth.session.adminUserId,
        action: "VEHICLE_FEATURE_UPDATED",
      },
    });
    return { success: true, feature };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update feature" };
  }
}

export async function archiveVehicleFeatureAction(featureId: string) {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  try {
    const feature = await db.vehicleFeature.update({
      where: { id: featureId },
      data: { isActive: false },
    });
    await db.auditLog.create({
      data: {
        adminUserId: auth.session.adminUserId,
        action: "VEHICLE_FEATURE_ARCHIVED",
      },
    });
    return { success: true, feature };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to archive feature" };
  }
}

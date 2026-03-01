"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isLicenseActive } from "@/lib/license";
import { locationFormSchema } from "@/lib/validators";
import { logAdminAction } from "@/lib/audit";

async function requireLocationManagementSession() {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Unauthorized" };
  if (!isLicenseActive() && session.role !== "ROOT") return { ok: false as const, error: "BOOKING_DISABLED" };
  if (session.role !== "ROOT" && session.role !== "OWNER") return { ok: false as const, error: "Forbidden" };
  return { ok: true as const, session };
}

function buildPayload(input: any) {
  const validated = locationFormSchema.parse(input);
  return {
    name: validated.name.trim(),
    code: validated.code ? validated.code.trim().toUpperCase() : null,
    address: validated.address ? validated.address.trim() : null,
  };
}

export async function createLocationAction(formData: any, _locale: string) {
  try {
    const auth = await requireLocationManagementSession();
    if (!auth.ok) return { success: false as const, error: auth.error };

    const payload = buildPayload(formData);
    const location = await db.location.create({ data: payload });

    await logAdminAction({
      adminUserId: auth.session.adminUserId,
      action: "LOCATION_CREATED",
    });

    return { success: true as const, location };
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to create location" };
  }
}

export async function updateLocationAction(locationId: string, formData: any, _locale: string) {
  try {
    const auth = await requireLocationManagementSession();
    if (!auth.ok) return { success: false as const, error: auth.error };

    const payload = buildPayload(formData);
    const location = await db.location.update({
      where: { id: locationId },
      data: payload,
    });

    await logAdminAction({
      adminUserId: auth.session.adminUserId,
      action: "LOCATION_UPDATED",
    });

    return { success: true as const, location };
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to update location" };
  }
}

export async function deleteLocationAction(locationId: string, _locale: string) {
  try {
    const auth = await requireLocationManagementSession();
    if (!auth.ok) return { success: false as const, error: auth.error };

    const location = await db.location.delete({
      where: { id: locationId },
    });

    await logAdminAction({
      adminUserId: auth.session.adminUserId,
      action: "LOCATION_DELETED",
    });

    return { success: true as const, location };
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to delete location" };
  }
}

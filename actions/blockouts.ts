/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { getSession } from "@/lib/session";
import { isLicenseActive } from "@/lib/license";
import { logAdminAction } from "@/lib/audit";
import { db } from "@/lib/db";
import { parseKralendijkDateTime } from "@/lib/datetime";
import { ensureVehicleBlockoutsTable } from "@/lib/vehicle-blockouts";

async function requireBlockoutAdmin() {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Unauthorized" };
  if (session.role !== "ROOT" && session.role !== "OWNER") return { ok: false as const, error: "Forbidden" };
  if (!isLicenseActive() && session.role !== "ROOT") return { ok: false as const, error: "BOOKING_DISABLED" };
  return { ok: true as const, session };
}

export async function createVehicleBlockoutAction(formData: FormData, locale: string) {
  const auth = await requireBlockoutAdmin();
  if (!auth.ok) return { success: false as const, error: auth.error };

  const vehicleIdRaw = String(formData.get("vehicleId") || "").trim();
  const vehicleId = vehicleIdRaw || null;
  const startDate = parseKralendijkDateTime(String(formData.get("startDate") || ""));
  const endDate = parseKralendijkDateTime(String(formData.get("endDate") || ""));
  const note = String(formData.get("note") || "").trim() || null;

  if (!startDate || !endDate || endDate <= startDate) {
    return { success: false as const, error: "Invalid date range" };
  }

  await ensureVehicleBlockoutsTable();
  await db.$executeRaw`
    INSERT INTO "VehicleBlockout" (id, "vehicleId", "startDate", "endDate", note)
    VALUES (${randomUUID()}, ${vehicleId}, ${startDate}, ${endDate}, ${note})
  `;
  await logAdminAction({
    adminUserId: auth.session.adminUserId,
    action: vehicleId ? "VEHICLE_BLOCKOUT_CREATED" : "GLOBAL_BLOCKOUT_CREATED",
  });
  revalidatePath(`/${locale}/admin/blockouts`);
  return { success: true as const };
}

export async function updateVehicleBlockoutAction(formData: FormData, locale: string) {
  const auth = await requireBlockoutAdmin();
  if (!auth.ok) return { success: false as const, error: auth.error };

  const blockoutId = String(formData.get("blockoutId") || "").trim();
  const vehicleIdRaw = String(formData.get("vehicleId") || "").trim();
  const vehicleId = vehicleIdRaw || null;
  const startDate = parseKralendijkDateTime(String(formData.get("startDate") || ""));
  const endDate = parseKralendijkDateTime(String(formData.get("endDate") || ""));
  const note = String(formData.get("note") || "").trim() || null;

  if (!blockoutId) {
    return { success: false as const, error: "Missing blockout id" };
  }

  if (!startDate || !endDate || endDate <= startDate) {
    return { success: false as const, error: "Invalid date range" };
  }

  await ensureVehicleBlockoutsTable();
  await db.$executeRaw`
    UPDATE "VehicleBlockout"
    SET
      "vehicleId" = ${vehicleId},
      "startDate" = ${startDate},
      "endDate" = ${endDate},
      note = ${note}
    WHERE id = ${blockoutId}
  `;
  await logAdminAction({
    adminUserId: auth.session.adminUserId,
    action: vehicleId ? "VEHICLE_BLOCKOUT_UPDATED" : "GLOBAL_BLOCKOUT_UPDATED",
  });
  revalidatePath(`/${locale}/admin/blockouts`);
  return { success: true as const };
}

export async function deleteVehicleBlockoutAction(blockoutId: string, locale: string) {
  const auth = await requireBlockoutAdmin();
  if (!auth.ok) return { success: false as const, error: auth.error };

  await ensureVehicleBlockoutsTable();
  await db.$executeRaw`
    DELETE FROM "VehicleBlockout"
    WHERE id = ${blockoutId}
  `;
  await logAdminAction({
    adminUserId: auth.session.adminUserId,
    action: "VEHICLE_BLOCKOUT_DELETED",
  });
  revalidatePath(`/${locale}/admin/blockouts`);
  return { success: true as const };
}

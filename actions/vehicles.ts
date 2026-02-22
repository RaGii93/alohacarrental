"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isLicenseActive } from "@/lib/license";
import { vehicleFormSchema } from "@/lib/validators";

export async function createVehicleAction(formData: any, locale: string) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    // Check license
    if (!isLicenseActive() && session.role !== "ROOT") {
      return { success: false, error: "BOOKING_DISABLED" };
    }

    const validated = vehicleFormSchema.parse(formData);

    const vehicle = await db.vehicle.create({
      data: {
        name: validated.name,
        plateNumber: validated.plateNumber,
        categoryId: validated.categoryId,
        dailyRate: Math.round(validated.dailyRate * 100), // Convert to cents
        status: validated.status,
        notes: validated.notes,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        adminUserId: session.adminUserId,
        action: "VEHICLE_CREATED",
      },
    });

    return { success: true, vehicle };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create vehicle" };
  }
}

export async function updateVehicleAction(
  vehicleId: string,
  formData: any,
  locale: string
) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    // Check license
    if (!isLicenseActive() && session.role !== "ROOT") {
      return { success: false, error: "BOOKING_DISABLED" };
    }

    const validated = vehicleFormSchema.parse(formData);

    const vehicle = await db.vehicle.update({
      where: { id: vehicleId },
      data: {
        name: validated.name,
        plateNumber: validated.plateNumber,
        categoryId: validated.categoryId,
        dailyRate: Math.round(validated.dailyRate * 100), // Convert to cents
        status: validated.status,
        notes: validated.notes,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        adminUserId: session.adminUserId,
        action: "VEHICLE_UPDATED",
      },
    });

    return { success: true, vehicle };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update vehicle" };
  }
}

export async function setVehicleStatusAction(
  vehicleId: string,
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE",
  locale: string
) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    // Check license
    if (!isLicenseActive() && session.role !== "ROOT") {
      return { success: false, error: "BOOKING_DISABLED" };
    }

    const vehicle = await db.vehicle.update({
      where: { id: vehicleId },
      data: { status },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        adminUserId: session.adminUserId,
        action: "VEHICLE_STATUS_CHANGED",
      },
    });

    return { success: true, vehicle };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update vehicle status" };
  }
}

export async function deleteVehicleAction(vehicleId: string, locale: string) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    // Check license
    if (!isLicenseActive() && session.role !== "ROOT") {
      return { success: false, error: "BOOKING_DISABLED" };
    }

    const vehicle = await db.vehicle.delete({
      where: { id: vehicleId },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        adminUserId: session.adminUserId,
        action: "VEHICLE_DELETED",
      },
    });

    return { success: true, vehicle };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete vehicle" };
  }
}

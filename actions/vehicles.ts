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

    let vehicle: any;
    try {
      vehicle = await db.vehicle.create({
        data: {
          name: validated.name,
          plateNumber: validated.plateNumber,
          categoryId: validated.categoryId,
          dailyRate: Math.round(validated.dailyRate * 100), // Convert to cents
          status: validated.status,
          notes: validated.notes,
        } as any,
      });
    } catch (e: any) {
      const message = String(e?.message || "");
      if (!message.includes("Unknown argument `categoryId`")) throw e;
      const category = await db.vehicleCategory.findUnique({ where: { id: validated.categoryId }, select: { name: true } });
      if (!category) return { success: false, error: "Invalid category" };
      const generatedId = crypto.randomUUID().replaceAll("-", "");
      const rows = await db.$queryRaw<Array<any>>`
        INSERT INTO "Vehicle" (id, name, "plateNumber", category, "dailyRate", status, notes)
        VALUES (${generatedId}, ${validated.name}, ${validated.plateNumber || null}, ${category.name}, ${Math.round(validated.dailyRate * 100)}, ${validated.status}::"VehicleStatus", ${validated.notes || null})
        RETURNING *
      `;
      vehicle = rows[0];
    }

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

    const existingVehicle = await db.vehicle.findUnique({
      where: { id: vehicleId },
      select: { status: true },
    });
    if (!existingVehicle) {
      return { success: false, error: "Vehicle not found" };
    }
    if (existingVehicle.status === "ON_RENT") {
      return { success: false, error: "ON_RENT_VEHICLE_LOCKED" };
    }

    let vehicle: any;
    try {
      vehicle = await db.vehicle.update({
        where: { id: vehicleId },
        data: {
          name: validated.name,
          plateNumber: validated.plateNumber,
          categoryId: validated.categoryId,
          dailyRate: Math.round(validated.dailyRate * 100), // Convert to cents
          status: validated.status,
          notes: validated.notes,
        } as any,
      });
    } catch (e: any) {
      const message = String(e?.message || "");
      if (!message.includes("Unknown argument `categoryId`")) throw e;
      const category = await db.vehicleCategory.findUnique({ where: { id: validated.categoryId }, select: { name: true } });
      if (!category) return { success: false, error: "Invalid category" };
      await db.$executeRaw`
        UPDATE "Vehicle"
        SET
          name = ${validated.name},
          "plateNumber" = ${validated.plateNumber || null},
          category = ${category.name},
          "dailyRate" = ${Math.round(validated.dailyRate * 100)},
          status = ${validated.status}::"VehicleStatus",
          notes = ${validated.notes || null}
        WHERE id = ${vehicleId}
      `;
      const rows = await db.$queryRaw<Array<any>>`
        SELECT * FROM "Vehicle" WHERE id = ${vehicleId} LIMIT 1
      `;
      vehicle = rows[0];
    }

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
  status: "ACTIVE" | "ON_RENT" | "MAINTENANCE" | "INACTIVE",
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

    const existingVehicle = await db.vehicle.findUnique({
      where: { id: vehicleId },
      select: { status: true },
    });
    if (!existingVehicle) {
      return { success: false, error: "Vehicle not found" };
    }
    if (existingVehicle.status === "ON_RENT" && status !== "ON_RENT") {
      return { success: false, error: "ON_RENT_VEHICLE_LOCKED" };
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

    const existingVehicle = await db.vehicle.findUnique({
      where: { id: vehicleId },
      select: { status: true },
    });
    if (!existingVehicle) {
      return { success: false, error: "Vehicle not found" };
    }
    if (existingVehicle.status === "ON_RENT") {
      return { success: false, error: "ON_RENT_VEHICLE_LOCKED" };
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

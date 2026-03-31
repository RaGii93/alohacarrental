"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getFleetOperationsSettings } from "@/lib/settings";

type MaintenancePartInput = {
  inventoryPartId?: string;
  customPartName?: string;
  quantity: number;
  unitCost: number;
  supplierName?: string;
  purchasedAt?: string;
  notes?: string;
};

type CreateMaintenanceRecordInput = {
  vehicleId: string;
  maintenanceTemplateId?: string;
  serviceType: "SMALL" | "BIG" | "CUSTOM" | "REPAIR" | "INSPECTION_PREP" | "INSURANCE_RELATED";
  title: string;
  description?: string;
  serviceDate: string;
  odometerKm?: number;
  nextDueKm?: number;
  vendorName?: string;
  invoiceNumber?: string;
  laborCost?: number;
  maintenanceCategory?: "MAINTENANCE" | "REPAIR" | "TIRES" | "BATTERY" | "AC" | "BRAKES" | "ENGINE" | "SUSPENSION" | "BODYWORK" | "ELECTRICAL" | "INSPECTION" | "INSURANCE" | "OTHER";
  isIncidentRelated?: boolean;
  notes?: string;
  parts: MaintenancePartInput[];
  allowNegativeInventory?: boolean;
  createUnavailability?: boolean;
  unavailableStart?: string;
  unavailableEnd?: string;
  unavailabilityReason?: string;
};

type CreateInventoryPartInput = {
  name: string;
  sku?: string;
  category?: string;
  brand?: string;
  unit?: string;
  quantityInStock?: number;
  reorderThreshold?: number;
  averageUnitCost?: number;
  defaultSupplierName?: string;
  isTireRelated?: boolean;
  tireBrandModel?: string;
};

type CreateInventoryTransactionInput = {
  inventoryPartId: string;
  type: "PURCHASE" | "USAGE" | "ADJUSTMENT" | "RETURN";
  quantity: number;
  unitCost?: number;
  notes?: string;
};

type CreateInsuranceRecordInput = {
  vehicleId: string;
  providerName: string;
  policyNumber?: string;
  coverageType?: string;
  startDate: string;
  endDate: string;
  premiumAmount?: number;
  paymentFrequency?: string;
  notes?: string;
};

type CreateInspectionRecordInput = {
  vehicleId: string;
  inspectionType?: string;
  inspectionDate: string;
  expiryDate?: string;
  passed?: boolean;
  authorityOrVendorName?: string;
  cost?: number;
  notes?: string;
};

async function requireFleetOperationsUser() {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Unauthorized" };
  if (!["ROOT", "OWNER", "STAFF"].includes(session.role)) {
    return { ok: false as const, error: "Forbidden" };
  }
  return { ok: true as const, session };
}

function parseDateOrThrow(value: string | undefined, label: string) {
  const parsed = new Date(String(value || ""));
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${label}`);
  }
  return parsed;
}

function cents(value: number | undefined) {
  return Math.max(0, Math.round(Number(value || 0) * 100));
}

function text(value: string | undefined) {
  const normalized = String(value || "").trim();
  return normalized || undefined;
}

function revalidateFleetOperations(locale: string) {
  revalidatePath(`/${locale}/admin/maintenance`);
  revalidatePath(`/${locale}/admin/inventory`);
  revalidatePath(`/${locale}/admin/fleet`);
  revalidatePath(`/${locale}/admin/vehicles`);
}

export async function createInventoryPartAction(input: CreateInventoryPartInput, locale: string) {
  try {
    const auth = await requireFleetOperationsUser();
    if (!auth.ok) return { success: false as const, error: auth.error };

    const name = text(input.name);
    if (!name) return { success: false as const, error: "Part name is required" };

    const part = await db.inventoryPart.create({
      data: {
        name,
        sku: text(input.sku),
        category: text(input.category),
        brand: text(input.brand),
        unit: text(input.unit),
        quantityInStock: Math.max(0, Number(input.quantityInStock || 0)),
        reorderThreshold: input.reorderThreshold === undefined ? null : Math.max(0, Number(input.reorderThreshold || 0)),
        averageUnitCost: input.averageUnitCost === undefined ? null : cents(input.averageUnitCost),
        defaultSupplierName: text(input.defaultSupplierName),
        isTireRelated: Boolean(input.isTireRelated),
        tireBrandModel: text(input.tireBrandModel),
      },
    });

    revalidateFleetOperations(locale);
    return { success: true as const, part };
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to create inventory part" };
  }
}

export async function createInventoryTransactionAction(input: CreateInventoryTransactionInput, locale: string) {
  try {
    const auth = await requireFleetOperationsUser();
    if (!auth.ok) return { success: false as const, error: auth.error };

    if (!input.inventoryPartId) return { success: false as const, error: "Inventory part is required" };
    if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
      return { success: false as const, error: "Quantity must be greater than zero" };
    }

    await db.$transaction(async (tx) => {
      const part = await tx.inventoryPart.findUnique({
        where: { id: input.inventoryPartId },
      });
      if (!part) throw new Error("Inventory part not found");

      const quantityDelta =
        input.type === "USAGE"
          ? -Math.abs(input.quantity)
          : input.type === "ADJUSTMENT"
            ? Number(input.quantity)
            : Math.abs(input.quantity);
      const nextQuantity = part.quantityInStock + quantityDelta;

      if (input.type === "USAGE" && nextQuantity < 0) {
        throw new Error("Not enough stock for this usage transaction");
      }

      const unitCostCents = input.unitCost === undefined ? undefined : cents(input.unitCost);
      const totalCost = unitCostCents === undefined ? null : Math.round(Math.abs(input.quantity) * unitCostCents);
      const averageUnitCost =
        unitCostCents !== undefined && quantityDelta > 0
          ? Math.round(
              (((part.averageUnitCost ?? 0) * part.quantityInStock) + unitCostCents * quantityDelta) /
                Math.max(1, part.quantityInStock + quantityDelta)
            )
          : part.averageUnitCost;

      await tx.inventoryPart.update({
        where: { id: part.id },
        data: {
          quantityInStock: nextQuantity,
          averageUnitCost,
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          inventoryPartId: part.id,
          type: input.type,
          quantity: Math.abs(input.quantity),
          unitCost: unitCostCents ?? null,
          totalCost,
          transactionDate: new Date(),
          notes: text(input.notes),
          createdByUserId: auth.session.adminUserId,
        },
      });
    });

    revalidateFleetOperations(locale);
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to save inventory transaction" };
  }
}

export async function createVehicleMaintenanceRecordAction(input: CreateMaintenanceRecordInput, locale: string) {
  try {
    const auth = await requireFleetOperationsUser();
    if (!auth.ok) return { success: false as const, error: auth.error };

    if (!input.vehicleId) return { success: false as const, error: "Vehicle is required" };
    const title = text(input.title);
    if (!title) return { success: false as const, error: "Title is required" };
    const serviceDate = parseDateOrThrow(input.serviceDate, "service date");
    const settings = await getFleetOperationsSettings();

    await db.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({
        where: { id: input.vehicleId },
        select: { id: true, currentOdometerKm: true },
      });
      if (!vehicle) throw new Error("Vehicle not found");

      const normalizedParts = (input.parts || [])
        .filter((part) => part.inventoryPartId || text(part.customPartName))
        .map((part) => ({
          inventoryPartId: text(part.inventoryPartId),
          customPartName: text(part.customPartName),
          quantity: Math.max(0.01, Number(part.quantity || 0)),
          unitCost: cents(part.unitCost),
          supplierName: text(part.supplierName),
          purchasedAt: part.purchasedAt ? parseDateOrThrow(part.purchasedAt, "purchase date") : undefined,
          notes: text(part.notes),
        }));

      for (const part of normalizedParts) {
        if (!part.inventoryPartId) continue;
        const inventoryPart = await tx.inventoryPart.findUnique({
          where: { id: part.inventoryPartId },
          select: { quantityInStock: true },
        });
        if (!inventoryPart) throw new Error("Inventory part not found");
        if (!input.allowNegativeInventory && inventoryPart.quantityInStock < part.quantity) {
          throw new Error("One or more parts do not have enough stock");
        }
      }

      const partsCost = normalizedParts.reduce((sum, part) => sum + part.unitCost * part.quantity, 0);
      const laborCost = cents(input.laborCost);
      const odometerKm = input.odometerKm === undefined ? undefined : Math.max(0, Math.round(input.odometerKm));
      const nextDueKm =
        input.nextDueKm !== undefined && Number.isFinite(input.nextDueKm)
          ? Math.max(0, Math.round(input.nextDueKm))
          : odometerKm !== undefined && input.serviceType === "SMALL"
            ? odometerKm + settings.defaultSmallServiceIntervalKm
            : odometerKm !== undefined && input.serviceType === "BIG"
              ? odometerKm + settings.defaultBigServiceIntervalKm
              : undefined;

      const record = await tx.vehicleMaintenanceRecord.create({
        data: {
          vehicleId: input.vehicleId,
          maintenanceTemplateId: text(input.maintenanceTemplateId),
          serviceType: input.serviceType,
          title,
          description: text(input.description),
          serviceDate,
          odometerKm,
          nextDueKm,
          vendorName: text(input.vendorName),
          invoiceNumber: text(input.invoiceNumber),
          laborCost,
          partsCost,
          totalCost: laborCost + partsCost,
          maintenanceCategory: input.maintenanceCategory,
          isIncidentRelated: Boolean(input.isIncidentRelated),
          notes: text(input.notes),
          createdByUserId: auth.session.adminUserId,
        },
      });

      for (const part of normalizedParts) {
        await tx.vehicleMaintenancePartUsage.create({
          data: {
            maintenanceRecordId: record.id,
            inventoryPartId: part.inventoryPartId,
            customPartName: part.customPartName,
            quantity: part.quantity,
            unitCost: part.unitCost,
            totalCost: Math.round(part.quantity * part.unitCost),
            supplierName: part.supplierName,
            purchasedAt: part.purchasedAt,
            notes: part.notes,
          },
        });

        if (part.inventoryPartId) {
          await tx.inventoryPart.update({
            where: { id: part.inventoryPartId },
            data: {
              quantityInStock: { decrement: part.quantity },
            },
          });

          await tx.inventoryTransaction.create({
            data: {
              inventoryPartId: part.inventoryPartId,
              type: "USAGE",
              quantity: part.quantity,
              unitCost: part.unitCost,
              totalCost: Math.round(part.quantity * part.unitCost),
              relatedVehicleId: input.vehicleId,
              relatedMaintenanceRecordId: record.id,
              transactionDate: serviceDate,
              notes: `Used in ${title}`,
              createdByUserId: auth.session.adminUserId,
            },
          });
        }
      }

      if (odometerKm !== undefined) {
        await tx.vehicle.update({
          where: { id: input.vehicleId },
          data: {
            currentOdometerKm: odometerKm,
          },
        });

        await tx.vehicleOdometerLog.create({
          data: {
            vehicleId: input.vehicleId,
            readingKm: odometerKm,
            readingDate: serviceDate,
            source: "MAINTENANCE",
            notes: `Recorded during ${title}`,
            createdByUserId: auth.session.adminUserId,
          },
        });
      }

      if (input.createUnavailability && input.unavailableStart) {
        await tx.vehicleUnavailabilityRecord.create({
          data: {
            vehicleId: input.vehicleId,
            type:
              input.serviceType === "REPAIR"
                ? "REPAIR"
                : input.serviceType === "INSPECTION_PREP"
                  ? "INSPECTION"
                  : input.serviceType === "INSURANCE_RELATED"
                    ? "INSURANCE_HOLD"
                    : "MAINTENANCE",
            startDate: parseDateOrThrow(input.unavailableStart, "downtime start"),
            endDate: input.unavailableEnd ? parseDateOrThrow(input.unavailableEnd, "downtime end") : null,
            reason: text(input.unavailabilityReason) || `Downtime for ${title}`,
            relatedMaintenanceRecordId: record.id,
            createdByUserId: auth.session.adminUserId,
          },
        });
      }
    });

    revalidateFleetOperations(locale);
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to save maintenance record" };
  }
}

export async function createVehicleInsuranceRecordAction(input: CreateInsuranceRecordInput, locale: string) {
  try {
    const auth = await requireFleetOperationsUser();
    if (!auth.ok) return { success: false as const, error: auth.error };

    const providerName = text(input.providerName);
    if (!providerName) return { success: false as const, error: "Insurance provider is required" };

    const startDate = parseDateOrThrow(input.startDate, "insurance start date");
    const endDate = parseDateOrThrow(input.endDate, "insurance end date");

    await db.$transaction(async (tx) => {
      await tx.vehicleInsuranceRecord.create({
        data: {
          vehicleId: input.vehicleId,
          providerName,
          policyNumber: text(input.policyNumber),
          coverageType: text(input.coverageType),
          startDate,
          endDate,
          premiumAmount: input.premiumAmount === undefined ? null : cents(input.premiumAmount),
          paymentFrequency: text(input.paymentFrequency),
          notes: text(input.notes),
          isActive: true,
        },
      });

      await tx.vehicle.update({
        where: { id: input.vehicleId },
        data: {
          insuranceProviderName: providerName,
          insurancePolicyNumber: text(input.policyNumber) ?? null,
          insuranceStartDate: startDate,
          insuranceEndDate: endDate,
          insuranceNotes: text(input.notes) ?? null,
        },
      });
    });

    revalidateFleetOperations(locale);
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to save insurance record" };
  }
}

export async function createVehicleInspectionRecordAction(input: CreateInspectionRecordInput, locale: string) {
  try {
    const auth = await requireFleetOperationsUser();
    if (!auth.ok) return { success: false as const, error: auth.error };

    const inspectionDate = parseDateOrThrow(input.inspectionDate, "inspection date");
    const expiryDate = input.expiryDate ? parseDateOrThrow(input.expiryDate, "inspection expiry date") : undefined;

    await db.$transaction(async (tx) => {
      await tx.vehicleInspectionRecord.create({
        data: {
          vehicleId: input.vehicleId,
          inspectionType: text(input.inspectionType),
          inspectionDate,
          expiryDate,
          passed: input.passed,
          authorityOrVendorName: text(input.authorityOrVendorName),
          cost: input.cost === undefined ? null : cents(input.cost),
          notes: text(input.notes),
          isActive: true,
        },
      });

      await tx.vehicle.update({
        where: { id: input.vehicleId },
        data: {
          inspectionDate,
          inspectionExpiryDate: expiryDate ?? null,
          inspectionNotes: text(input.notes) ?? null,
        },
      });
    });

    revalidateFleetOperations(locale);
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to save inspection record" };
  }
}

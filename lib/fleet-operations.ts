import { db } from "@/lib/db";
import { getFleetOperationsSettings } from "@/lib/settings";

export type DueStatus = "OK" | "DUE_SOON" | "OVERDUE" | "UNKNOWN";

export type ServiceDueStatus = {
  lastServiceDate?: Date;
  lastServiceKm?: number;
  nextDueKm?: number;
  kmRemaining?: number;
  status: DueStatus;
};

export type VehicleMaintenanceStatus = {
  vehicleId: string;
  currentOdometerKm?: number;
  smallService: ServiceDueStatus;
  bigService: ServiceDueStatus;
};

export type VehicleComplianceStatus = {
  insurance: {
    enabled: boolean;
    status: DueStatus;
    active: boolean;
    daysUntilExpiry?: number;
    expiryDate?: Date;
  };
  inspection: {
    enabled: boolean;
    status: DueStatus;
    active: boolean;
    daysUntilExpiry?: number;
    expiryDate?: Date;
    label: string;
  };
  maintenance: {
    status: DueStatus;
    smallServiceStatus: DueStatus;
    bigServiceStatus: DueStatus;
  };
};

export type VehicleCostSummary = {
  purchasePrice: number;
  totalMaintenanceCost: number;
  totalRepairCost: number;
  totalPartsCost: number;
  totalLaborCost: number;
  tireCosts: number;
  insuranceCosts: number;
  inspectionCosts: number;
  totalTrackedVehicleCosts: number;
  costPerKm?: number;
};

export type VehicleRevenueSummary = {
  assignedBookingCount: number;
  totalRevenue: number;
  revenuePerKm?: number;
};

export type VehicleProfitabilitySummary = {
  costs: VehicleCostSummary;
  revenue: VehicleRevenueSummary;
  netContribution: number;
};

export type FleetOperationsOverview = {
  totalVehicles: number;
  dueSoonVehicles: number;
  overdueVehicles: number;
  lowStockParts: number;
  totalTrackedVehicleCosts: number;
  totalRevenue: number;
  netContribution: number;
};

function toDueStatus(kmRemaining: number | undefined, thresholdKm: number): DueStatus {
  if (kmRemaining === undefined) return "UNKNOWN";
  if (kmRemaining < 0) return "OVERDUE";
  if (kmRemaining <= thresholdKm) return "DUE_SOON";
  return "OK";
}

function toDateDueStatus(daysUntilExpiry: number | undefined, dueSoonDays: number): DueStatus {
  if (daysUntilExpiry === undefined) return "UNKNOWN";
  if (daysUntilExpiry < 0) return "OVERDUE";
  if (daysUntilExpiry <= dueSoonDays) return "DUE_SOON";
  return "OK";
}

function dayDiff(from: Date, to: Date) {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

// FUTURE: split these queries further for CSV/PDF export, supplier entity joins, and recurring/depreciation cost layers.
export async function calculateNextServiceDue(vehicleId: string): Promise<VehicleMaintenanceStatus> {
  const [vehicle, settings, serviceRows] = await Promise.all([
    db.vehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, currentOdometerKm: true },
    }),
    getFleetOperationsSettings(),
    db.vehicleMaintenanceRecord.findMany({
      where: {
        vehicleId,
        serviceType: { in: ["SMALL", "BIG"] },
      },
      select: {
        serviceType: true,
        serviceDate: true,
        odometerKm: true,
        nextDueKm: true,
      },
      orderBy: [{ serviceDate: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  const currentOdometerKm = vehicle.currentOdometerKm ?? undefined;
  const dueSoonThresholdKm = settings.serviceDueSoonThresholdKm ?? settings.reminderSeverityDueSoonKm ?? 1000;
  const latestSmall = serviceRows.find((row) => row.serviceType === "SMALL");
  const latestBig = serviceRows.find((row) => row.serviceType === "BIG");

  const buildStatus = (record: typeof latestSmall, defaultIntervalKm: number): ServiceDueStatus => {
    if (!record || !record.odometerKm) {
      return { status: currentOdometerKm === undefined ? "UNKNOWN" : "DUE_SOON" };
    }
    const nextDueKm = record.nextDueKm ?? (record.odometerKm + defaultIntervalKm);
    const kmRemaining = currentOdometerKm === undefined ? undefined : nextDueKm - currentOdometerKm;
    return {
      lastServiceDate: record.serviceDate,
      lastServiceKm: record.odometerKm ?? undefined,
      nextDueKm,
      kmRemaining,
      status: toDueStatus(kmRemaining, dueSoonThresholdKm),
    };
  };

  return {
    vehicleId,
    currentOdometerKm,
    smallService: buildStatus(latestSmall, settings.defaultSmallServiceIntervalKm),
    bigService: buildStatus(latestBig, settings.defaultBigServiceIntervalKm),
  };
}

export async function getVehicleMaintenanceStatus(vehicleId: string) {
  return calculateNextServiceDue(vehicleId);
}

export async function getVehicleComplianceStatus(vehicleId: string): Promise<VehicleComplianceStatus> {
  const [vehicle, settings, maintenance] = await Promise.all([
    db.vehicle.findUnique({
      where: { id: vehicleId },
      select: {
        insuranceEndDate: true,
        inspectionExpiryDate: true,
      },
    }),
    getFleetOperationsSettings(),
    calculateNextServiceDue(vehicleId),
  ]);

  if (!vehicle) throw new Error("Vehicle not found");

  const today = new Date();
  const insuranceDays = vehicle.insuranceEndDate ? dayDiff(today, vehicle.insuranceEndDate) : undefined;
  const inspectionDays = vehicle.inspectionExpiryDate ? dayDiff(today, vehicle.inspectionExpiryDate) : undefined;
  const insuranceStatus = settings.insuranceFeatureEnabled
    ? toDateDueStatus(insuranceDays, settings.insuranceReminderDaysBefore)
    : "UNKNOWN";
  const inspectionStatus = settings.inspectionFeatureEnabled
    ? toDateDueStatus(inspectionDays, settings.inspectionReminderDaysBefore)
    : "UNKNOWN";
  const maintenanceStatus = maintenance.smallService.status === "OVERDUE" || maintenance.bigService.status === "OVERDUE"
    ? "OVERDUE"
    : maintenance.smallService.status === "DUE_SOON" || maintenance.bigService.status === "DUE_SOON"
      ? "DUE_SOON"
      : maintenance.smallService.status === "UNKNOWN" && maintenance.bigService.status === "UNKNOWN"
        ? "UNKNOWN"
        : "OK";

  return {
    insurance: {
      enabled: settings.insuranceFeatureEnabled,
      status: insuranceStatus,
      active: insuranceStatus !== "OVERDUE",
      daysUntilExpiry: insuranceDays,
      expiryDate: vehicle.insuranceEndDate ?? undefined,
    },
    inspection: {
      enabled: settings.inspectionFeatureEnabled,
      status: inspectionStatus,
      active: inspectionStatus !== "OVERDUE",
      daysUntilExpiry: inspectionDays,
      expiryDate: vehicle.inspectionExpiryDate ?? undefined,
      label: settings.inspectionLabel,
    },
    maintenance: {
      status: maintenanceStatus,
      smallServiceStatus: maintenance.smallService.status,
      bigServiceStatus: maintenance.bigService.status,
    },
  };
}

export async function getVehicleDueItems(vehicleId: string) {
  const [maintenance, compliance] = await Promise.all([
    getVehicleMaintenanceStatus(vehicleId),
    getVehicleComplianceStatus(vehicleId),
  ]);

  return [
    { key: "small_service", status: maintenance.smallService.status, dueKm: maintenance.smallService.nextDueKm },
    { key: "big_service", status: maintenance.bigService.status, dueKm: maintenance.bigService.nextDueKm },
    { key: "insurance", status: compliance.insurance.status, dueDate: compliance.insurance.expiryDate },
    { key: "inspection", status: compliance.inspection.status, dueDate: compliance.inspection.expiryDate },
  ];
}

export async function getVehiclesDueSoon() {
  const vehicles = await db.vehicle.findMany({
    select: { id: true, name: true, plateNumber: true },
    orderBy: { name: "asc" },
  });
  const statuses = await Promise.all(
    vehicles.map(async (vehicle) => ({
      vehicle,
      maintenance: await getVehicleMaintenanceStatus(vehicle.id),
      compliance: await getVehicleComplianceStatus(vehicle.id),
    }))
  );
  return statuses.filter(({ maintenance, compliance }) =>
    [maintenance.smallService.status, maintenance.bigService.status, compliance.insurance.status, compliance.inspection.status].includes("DUE_SOON")
  );
}

export async function getVehiclesOverdue() {
  const vehicles = await db.vehicle.findMany({
    select: { id: true, name: true, plateNumber: true },
    orderBy: { name: "asc" },
  });
  const statuses = await Promise.all(
    vehicles.map(async (vehicle) => ({
      vehicle,
      maintenance: await getVehicleMaintenanceStatus(vehicle.id),
      compliance: await getVehicleComplianceStatus(vehicle.id),
    }))
  );
  return statuses.filter(({ maintenance, compliance }) =>
    [maintenance.smallService.status, maintenance.bigService.status, compliance.insurance.status, compliance.inspection.status].includes("OVERDUE")
  );
}

export async function getVehicleCostSummary(vehicleId: string): Promise<VehicleCostSummary> {
  const [vehicle, maintenanceRows, insuranceRows, inspectionRows] = await Promise.all([
    db.vehicle.findUnique({
      where: { id: vehicleId },
      select: { purchasePrice: true, currentOdometerKm: true },
    }),
    db.vehicleMaintenanceRecord.findMany({
      where: { vehicleId },
      select: { totalCost: true, partsCost: true, laborCost: true, maintenanceCategory: true },
    }),
    db.vehicleInsuranceRecord.findMany({
      where: { vehicleId },
      select: { premiumAmount: true },
    }),
    db.vehicleInspectionRecord.findMany({
      where: { vehicleId },
      select: { cost: true },
    }),
  ]);

  if (!vehicle) throw new Error("Vehicle not found");

  const totalMaintenanceCost = maintenanceRows
    .filter((row) => row.maintenanceCategory !== "REPAIR")
    .reduce((sum, row) => sum + row.totalCost, 0);
  const totalRepairCost = maintenanceRows
    .filter((row) => row.maintenanceCategory === "REPAIR")
    .reduce((sum, row) => sum + row.totalCost, 0);
  const totalPartsCost = maintenanceRows.reduce((sum, row) => sum + row.partsCost, 0);
  const totalLaborCost = maintenanceRows.reduce((sum, row) => sum + row.laborCost, 0);
  const tireCosts = maintenanceRows
    .filter((row) => row.maintenanceCategory === "TIRES")
    .reduce((sum, row) => sum + row.totalCost, 0);
  const insuranceCosts = insuranceRows.reduce((sum, row) => sum + (row.premiumAmount ?? 0), 0);
  const inspectionCosts = inspectionRows.reduce((sum, row) => sum + (row.cost ?? 0), 0);
  const totalTrackedVehicleCosts =
    (vehicle.purchasePrice ?? 0) +
    totalMaintenanceCost +
    totalRepairCost +
    insuranceCosts +
    inspectionCosts;

  return {
    purchasePrice: vehicle.purchasePrice ?? 0,
    totalMaintenanceCost,
    totalRepairCost,
    totalPartsCost,
    totalLaborCost,
    tireCosts,
    insuranceCosts,
    inspectionCosts,
    totalTrackedVehicleCosts,
    costPerKm: vehicle.currentOdometerKm && vehicle.currentOdometerKm > 0
      ? Math.round(totalTrackedVehicleCosts / vehicle.currentOdometerKm)
      : undefined,
  };
}

export async function getVehicleRevenueSummary(vehicleId: string): Promise<VehicleRevenueSummary> {
  // FUTURE: split attributed rental revenue from recurring costs, depreciation, and downtime-loss analytics.
  const bookings = await db.booking.findMany({
    where: { vehicleId, status: "CONFIRMED" },
    select: { totalAmount: true, startDate: true, endDate: true },
  });
  const vehicle = await db.vehicle.findUnique({
    where: { id: vehicleId },
    select: { currentOdometerKm: true },
  });
  if (!vehicle) throw new Error("Vehicle not found");
  const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);

  return {
    assignedBookingCount: bookings.length,
    totalRevenue,
    revenuePerKm: vehicle.currentOdometerKm && vehicle.currentOdometerKm > 0
      ? Math.round(totalRevenue / vehicle.currentOdometerKm)
      : undefined,
  };
}

export async function getVehicleProfitabilitySummary(vehicleId: string): Promise<VehicleProfitabilitySummary> {
  const [costs, revenue] = await Promise.all([
    getVehicleCostSummary(vehicleId),
    getVehicleRevenueSummary(vehicleId),
  ]);

  return {
    costs,
    revenue,
    netContribution: revenue.totalRevenue - costs.totalTrackedVehicleCosts,
  };
}

export async function listLowStockParts(limit = 10) {
  const settings = await getFleetOperationsSettings();
  if (!settings.inventoryModuleEnabled || !settings.lowStockThresholdEnabled) return [];

  const parts = await db.inventoryPart.findMany({
    where: { isActive: true },
    orderBy: [{ quantityInStock: "asc" }, { name: "asc" }],
    take: Math.max(limit, 1),
  });

  return parts.filter((part) => {
    const threshold = part.reorderThreshold ?? settings.defaultLowStockThreshold;
    return part.quantityInStock <= threshold;
  });
}

export async function getFleetOperationsOverview(): Promise<FleetOperationsOverview> {
  const [vehicles, lowStockParts, maintenanceAgg, insuranceAgg, inspectionAgg, revenueAgg] = await Promise.all([
    db.vehicle.findMany({ select: { id: true } }),
    listLowStockParts(100),
    db.vehicleMaintenanceRecord.aggregate({
      _sum: { totalCost: true },
    }),
    db.vehicleInsuranceRecord.aggregate({
      _sum: { premiumAmount: true },
    }),
    db.vehicleInspectionRecord.aggregate({
      _sum: { cost: true },
    }),
    db.booking.aggregate({
      where: { status: "CONFIRMED", vehicleId: { not: null } },
      _sum: { totalAmount: true },
    }),
  ]);

  const statuses = await Promise.all(
    vehicles.map(async (vehicle) => {
      const compliance = await getVehicleComplianceStatus(vehicle.id);
      return compliance;
    })
  );

  const dueSoonVehicles = statuses.filter((status) =>
    [
      status.maintenance.status,
      status.insurance.status,
      status.inspection.status,
    ].includes("DUE_SOON")
  ).length;

  const overdueVehicles = statuses.filter((status) =>
    [
      status.maintenance.status,
      status.insurance.status,
      status.inspection.status,
    ].includes("OVERDUE")
  ).length;

  const totalTrackedVehicleCosts =
    (maintenanceAgg._sum.totalCost ?? 0) +
    (insuranceAgg._sum.premiumAmount ?? 0) +
    (inspectionAgg._sum.cost ?? 0);
  const totalRevenue = revenueAgg._sum.totalAmount ?? 0;

  return {
    totalVehicles: vehicles.length,
    dueSoonVehicles,
    overdueVehicles,
    lowStockParts: lowStockParts.length,
    totalTrackedVehicleCosts,
    totalRevenue,
    netContribution: totalRevenue - totalTrackedVehicleCosts,
  };
}

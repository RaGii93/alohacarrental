import { Prisma, VehicleMaintenanceServiceType } from "@prisma/client";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { getVehicleComplianceStatus } from "@/lib/fleet-operations";

const MAINTENANCE_SERVICE_OPTIONS = new Set<VehicleMaintenanceServiceType>([
  "SMALL",
  "BIG",
  "REPAIR",
  "CUSTOM",
  "INSPECTION_PREP",
  "INSURANCE_RELATED",
]);

const ATTENTION_FILTERS = new Set(["ACTION_REQUIRED", "OVERDUE", "DUE_SOON"]);

const parseDateBoundary = (value: string | null, boundary: "start" | "end") => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const suffix = boundary === "start" ? "T00:00:00.000Z" : "T23:59:59.999Z";
  const parsed = new Date(`${value}${suffix}`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const escapeCsv = (value: unknown) => {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, "\"\"")}"`;
  return text;
};

const toCsv = (rows: Array<Record<string, unknown>>) => {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")),
  ].join("\n");
};

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "ROOT" && session.role !== "OWNER")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") || "history";
  const searchTerm = (searchParams.get("q") || "").trim();
  const selectedVehicleId = (searchParams.get("vehicle") || "").trim();
  const selectedAttention = ATTENTION_FILTERS.has(searchParams.get("attention") || "") ? searchParams.get("attention")! : "";
  const selectedService = MAINTENANCE_SERVICE_OPTIONS.has((searchParams.get("service") || "") as VehicleMaintenanceServiceType)
    ? (searchParams.get("service") as VehicleMaintenanceServiceType)
    : undefined;
  const startDate = parseDateBoundary(searchParams.get("start"), "start");
  const endDate = parseDateBoundary(searchParams.get("end"), "end");

  if (scope === "reminders") {
    const vehicles = await db.vehicle.findMany({
      where: {
        ...(selectedVehicleId ? { id: selectedVehicleId } : {}),
        ...(searchTerm
          ? {
              OR: [
                { name: { contains: searchTerm, mode: "insensitive" } },
                { plateNumber: { contains: searchTerm, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        plateNumber: true,
        insuranceEndDate: true,
        inspectionExpiryDate: true,
      },
    });

    const complianceRows = await Promise.all(
      vehicles.map(async (vehicle) => {
        const compliance = await getVehicleComplianceStatus(vehicle.id);
        const statuses = [compliance.maintenance.status, compliance.insurance.status, compliance.inspection.status];
        const isOverdue = statuses.includes("OVERDUE");
        const isDueSoon = statuses.includes("DUE_SOON");
        const attentionBucket = isOverdue ? "OVERDUE" : isDueSoon ? "DUE_SOON" : "OK";

        return {
          vehicle: vehicle.name,
          plateNumber: vehicle.plateNumber || "",
          attention: attentionBucket,
          maintenanceStatus: compliance.maintenance.status,
          insuranceStatus: compliance.insurance.status,
          inspectionStatus: compliance.inspection.status,
          insuranceExpiryDate: vehicle.insuranceEndDate?.toISOString().slice(0, 10) || "",
          inspectionExpiryDate: vehicle.inspectionExpiryDate?.toISOString().slice(0, 10) || "",
        };
      })
    );

    const rows = complianceRows.filter((row) => {
      if (selectedAttention === "OVERDUE") return row.attention === "OVERDUE";
      if (selectedAttention === "DUE_SOON") return row.attention === "DUE_SOON";
      if (selectedAttention === "ACTION_REQUIRED") return row.attention === "OVERDUE" || row.attention === "DUE_SOON";
      return row.attention === "OVERDUE" || row.attention === "DUE_SOON";
    });

    return new Response(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="maintenance-reminders.csv"`,
      },
    });
  }

  const records = await db.vehicleMaintenanceRecord.findMany({
    where: {
      ...(selectedVehicleId ? { vehicleId: selectedVehicleId } : {}),
      ...(selectedService ? { serviceType: selectedService } : {}),
      ...((startDate || endDate)
        ? {
            serviceDate: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
      ...(searchTerm
        ? {
            OR: [
              { title: { contains: searchTerm, mode: "insensitive" } },
              { vendorName: { contains: searchTerm, mode: "insensitive" } },
              { vehicle: { name: { contains: searchTerm, mode: "insensitive" } } },
              { vehicle: { plateNumber: { contains: searchTerm, mode: "insensitive" } } },
            ],
          }
        : {}),
    } satisfies Prisma.VehicleMaintenanceRecordWhereInput,
    orderBy: [{ serviceDate: "desc" }, { createdAt: "desc" }],
    select: {
      serviceDate: true,
      title: true,
      serviceType: true,
      maintenanceCategory: true,
      vendorName: true,
      laborCost: true,
      partsCost: true,
      totalCost: true,
      notes: true,
      vehicle: {
        select: {
          name: true,
          plateNumber: true,
        },
      },
    },
  });

  const rows = records.map((record) => ({
    serviceDate: record.serviceDate.toISOString().slice(0, 10),
    vehicle: record.vehicle.name,
    plateNumber: record.vehicle.plateNumber || "",
    title: record.title,
    serviceType: record.serviceType,
    maintenanceCategory: record.maintenanceCategory || "",
    vendorName: record.vendorName || "",
    laborCost: record.laborCost / 100,
    partsCost: record.partsCost / 100,
    totalCost: record.totalCost / 100,
    notes: record.notes || "",
  }));

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="maintenance-history.csv"`,
    },
  });
}

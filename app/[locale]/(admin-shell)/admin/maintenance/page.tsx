import { getTranslations } from "next-intl/server";
import { Prisma, VehicleMaintenanceServiceType } from "@prisma/client";
import { db } from "@/lib/db";
import { ADMIN_PAGE_KICKER, ADMIN_PAGE_SHELL, ADMIN_PAGE_STACK, requireAdminSection } from "@/app/[locale]/admin/_lib";
import { FleetOpsFilters } from "@/components/admin/FleetOpsFilters";
import { MaintenanceOverviewClient } from "@/components/admin/MaintenanceOverviewClient";
import { Button } from "@/components/ui/button";
import { getFleetOperationsOverview, getVehicleComplianceStatus, listLowStockParts } from "@/lib/fleet-operations";

const MAINTENANCE_SERVICE_OPTIONS: Array<{ value: VehicleMaintenanceServiceType; label: string }> = [
  { value: "SMALL", label: "admin.maintenance.serviceTypes.small" },
  { value: "BIG", label: "admin.maintenance.serviceTypes.big" },
  { value: "REPAIR", label: "admin.maintenance.serviceTypes.repair" },
  { value: "CUSTOM", label: "admin.maintenance.serviceTypes.custom" },
  { value: "INSPECTION_PREP", label: "admin.maintenance.serviceTypes.inspectionPrep" },
  { value: "INSURANCE_RELATED", label: "admin.maintenance.serviceTypes.insuranceRelated" },
];

const ATTENTION_FILTERS = new Set(["ACTION_REQUIRED", "OVERDUE", "DUE_SOON"]);

const parseDateBoundary = (value: string | undefined, boundary: "start" | "end") => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const suffix = boundary === "start" ? "T00:00:00.000Z" : "T23:59:59.999Z";
  const parsed = new Date(`${value}${suffix}`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export default async function AdminMaintenancePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    vehicle?: string;
    attention?: string;
    service?: string;
    start?: string;
    end?: string;
  }>;
}) {
  const { locale } = await params;
  const { q, vehicle, attention, service, start, end } = await searchParams;
  const t = await getTranslations();
  await requireAdminSection(locale, "maintenance");

  const searchTerm = q?.trim() || "";
  const selectedVehicleId = vehicle?.trim() || "";
  const selectedAttention = ATTENTION_FILTERS.has(attention || "") ? attention! : "";
  const selectedService: VehicleMaintenanceServiceType | "" = MAINTENANCE_SERVICE_OPTIONS.some((option) => option.value === service)
    ? (service as VehicleMaintenanceServiceType)
    : "";
  const startDate = parseDateBoundary(start, "start");
  const endDate = parseDateBoundary(end, "end");

  const recentRecordsWhere: Prisma.VehicleMaintenanceRecordWhereInput = {
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
  };

  const complianceVehicleWhere: Prisma.VehicleWhereInput = {
    ...(selectedVehicleId ? { id: selectedVehicleId } : {}),
    ...(searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { plateNumber: { contains: searchTerm, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [summary, vehicles, templates, inventoryParts, recentRecords, allVehicles] = await Promise.all([
    getFleetOperationsOverview(),
    db.vehicle.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        plateNumber: true,
        currentOdometerKm: true,
      },
    }),
    db.maintenanceTemplate.findMany({
      where: { isActive: true },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      select: { id: true, name: true, type: true },
    }),
    db.inventoryPart.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, quantityInStock: true },
    }),
    db.vehicleMaintenanceRecord.findMany({
      where: recentRecordsWhere,
      orderBy: [{ serviceDate: "desc" }, { createdAt: "desc" }],
      take: 50,
      select: {
        id: true,
        title: true,
        serviceType: true,
        maintenanceCategory: true,
        serviceDate: true,
        totalCost: true,
        vendorName: true,
        vehicle: {
          select: {
            id: true,
            name: true,
            plateNumber: true,
          },
        },
      },
    }),
    db.vehicle.findMany({
      where: complianceVehicleWhere,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        plateNumber: true,
        insuranceEndDate: true,
        inspectionExpiryDate: true,
      },
    }),
  ]);

  const complianceRows = await Promise.all(
    allVehicles.map(async (vehicle) => {
      const compliance = await getVehicleComplianceStatus(vehicle.id);
      return {
        id: vehicle.id,
        name: vehicle.name,
        plateNumber: vehicle.plateNumber,
        maintenanceStatus: compliance.maintenance.status,
        smallServiceStatus: compliance.maintenance.smallServiceStatus,
        bigServiceStatus: compliance.maintenance.bigServiceStatus,
        insuranceStatus: compliance.insurance.status,
        inspectionStatus: compliance.inspection.status,
        insuranceExpiryDate: vehicle.insuranceEndDate?.toISOString() ?? null,
        inspectionExpiryDate: vehicle.inspectionExpiryDate?.toISOString() ?? null,
      };
    })
  );

  const dueSoon = complianceRows.filter((vehicle) =>
    [vehicle.maintenanceStatus, vehicle.insuranceStatus, vehicle.inspectionStatus].includes("DUE_SOON")
  );
  const overdue = complianceRows.filter((vehicle) =>
    [vehicle.maintenanceStatus, vehicle.insuranceStatus, vehicle.inspectionStatus].includes("OVERDUE")
  );
  const visibleDueSoon = selectedAttention === "OVERDUE" ? [] : dueSoon;
  const visibleOverdue = selectedAttention === "DUE_SOON" ? [] : overdue;
  const hasAttentionFilter = selectedAttention === "ACTION_REQUIRED" || selectedAttention === "OVERDUE" || selectedAttention === "DUE_SOON";
  const filteredDueSoon = hasAttentionFilter ? visibleDueSoon : dueSoon;
  const filteredOverdue = hasAttentionFilter ? visibleOverdue : overdue;
  const exportParams = new URLSearchParams();
  if (searchTerm) exportParams.set("q", searchTerm);
  if (selectedVehicleId) exportParams.set("vehicle", selectedVehicleId);
  if (selectedAttention) exportParams.set("attention", selectedAttention);
  if (selectedService) exportParams.set("service", selectedService);
  if (start) exportParams.set("start", start);
  if (end) exportParams.set("end", end);

  await listLowStockParts();

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_PAGE_STACK}>
        <div>
          <p className={ADMIN_PAGE_KICKER}>{t.has("admin.dashboard.tabs.maintenance" as any) ? t("admin.dashboard.tabs.maintenance" as any) : "Maintenance"}</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">{t("admin.maintenance.page.title")}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            {t("admin.maintenance.page.description")}
          </p>
        </div>

        <FleetOpsFilters
          title={t("admin.maintenance.filters.title")}
          description={t("admin.maintenance.filters.description")}
          audiences={[
            t("admin.maintenance.audiences.financialClerk"),
            t("admin.maintenance.audiences.mechanic"),
            t("admin.maintenance.audiences.administration"),
            t("admin.maintenance.audiences.rentalAgent"),
          ]}
          resultSummary={t("admin.maintenance.filters.resultSummary", { overdue: filteredOverdue.length, dueSoon: filteredDueSoon.length, records: recentRecords.length })}
          search={{
            initialValue: searchTerm,
            placeholder: t("admin.maintenance.filters.searchPlaceholder"),
          }}
          selects={[
            {
              param: "vehicle",
              label: t("admin.maintenance.form.vehicle"),
              placeholder: t("admin.maintenance.filters.allVehicles"),
              allLabel: t("admin.maintenance.filters.allVehicles"),
              options: vehicles.map((entry) => ({
                value: entry.id,
                label: entry.plateNumber ? `${entry.name} (${entry.plateNumber})` : entry.name,
              })),
            },
            {
              param: "attention",
              label: t("admin.maintenance.filters.attention"),
              placeholder: t("admin.maintenance.filters.allStatuses"),
              allLabel: t("admin.maintenance.filters.allStatuses"),
              options: [
                { value: "ACTION_REQUIRED", label: t("admin.maintenance.filters.actionRequired") },
                { value: "OVERDUE", label: t("admin.maintenance.badges.overdue") },
                { value: "DUE_SOON", label: t("admin.maintenance.badges.dueSoon") },
              ],
            },
            {
              param: "service",
              label: t("admin.maintenance.filters.serviceType"),
              placeholder: t("admin.maintenance.filters.allServiceTypes"),
              allLabel: t("admin.maintenance.filters.allServiceTypes"),
              options: MAINTENANCE_SERVICE_OPTIONS.map((option) => ({ value: option.value, label: t(option.label as any) })),
            },
          ]}
          dateRange={{
            initialStart: start,
            initialEnd: end,
          }}
        />

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-xl">
            <a href={`/api/admin/maintenance/export?${new URLSearchParams([...exportParams.entries(), ["scope", "history"]]).toString()}`}>
              {t("admin.maintenance.actions.exportHistory")}
            </a>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <a href={`/api/admin/maintenance/export?${new URLSearchParams([...exportParams.entries(), ["scope", "reminders"]]).toString()}`}>
              {t("admin.maintenance.actions.exportReminders")}
            </a>
          </Button>
        </div>

        <MaintenanceOverviewClient
          locale={locale}
          summary={summary}
          vehicles={vehicles}
          templates={templates}
          inventoryParts={inventoryParts}
          dueSoon={filteredDueSoon}
          overdue={filteredOverdue}
          recentRecords={recentRecords.map((record) => ({
            id: record.id,
            vehicleId: record.vehicle.id,
            vehicleName: record.vehicle.name,
            plateNumber: record.vehicle.plateNumber,
            title: record.title,
            serviceType: record.serviceType,
            maintenanceCategory: record.maintenanceCategory,
            serviceDate: record.serviceDate.toISOString(),
            totalCost: record.totalCost,
            vendorName: record.vendorName,
          }))}
        />
      </div>
    </div>
  );
}

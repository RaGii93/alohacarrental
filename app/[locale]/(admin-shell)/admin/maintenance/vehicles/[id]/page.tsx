import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeDollarSign, CalendarRange, CarFront, ClipboardList, HandCoins, ShieldCheck, Wrench } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { ADMIN_PAGE_KICKER, ADMIN_PAGE_SHELL, ADMIN_PAGE_STACK, requireAdminSection } from "@/app/[locale]/admin/_lib";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/datetime";
import { getVehicleComplianceStatus, getVehicleProfitabilitySummary } from "@/lib/fleet-operations";
import { formatCurrency } from "@/lib/pricing";

function statusTone(status: "OK" | "DUE_SOON" | "OVERDUE" | "UNKNOWN") {
  switch (status) {
    case "OVERDUE":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    case "DUE_SOON":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "OK":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

export default async function AdminMaintenanceVehicleHistoryPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations();
  await requireAdminSection(locale, "maintenance");

  const vehicle = await db.vehicle.findUnique({
    where: { id },
    include: {
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!vehicle) notFound();

  const [profitability, compliance, maintenanceRecords, insuranceRecords, inspectionRecords, bookings, downtimeRecords] = await Promise.all([
    getVehicleProfitabilitySummary(id),
    getVehicleComplianceStatus(id),
    db.vehicleMaintenanceRecord.findMany({
      where: { vehicleId: id },
      orderBy: [{ serviceDate: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        serviceType: true,
        maintenanceCategory: true,
        serviceDate: true,
        vendorName: true,
        odometerKm: true,
        laborCost: true,
        partsCost: true,
        totalCost: true,
        notes: true,
      },
    }),
    db.vehicleInsuranceRecord.findMany({
      where: { vehicleId: id },
      orderBy: [{ endDate: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        providerName: true,
        policyNumber: true,
        coverageType: true,
        startDate: true,
        endDate: true,
        premiumAmount: true,
        notes: true,
      },
    }),
    db.vehicleInspectionRecord.findMany({
      where: { vehicleId: id },
      orderBy: [{ inspectionDate: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        inspectionType: true,
        inspectionDate: true,
        expiryDate: true,
        authorityOrVendorName: true,
        cost: true,
        notes: true,
      },
    }),
    db.booking.findMany({
      where: { vehicleId: id, status: "CONFIRMED" },
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        bookingCode: true,
        customerName: true,
        startDate: true,
        endDate: true,
        totalAmount: true,
        deliveredAt: true,
        returnedAt: true,
      },
    }),
    db.vehicleUnavailabilityRecord.findMany({
      where: { vehicleId: id },
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        type: true,
        startDate: true,
        endDate: true,
        reason: true,
      },
    }),
  ]);

  return (
    <div className={ADMIN_PAGE_SHELL}>
      <div className={ADMIN_PAGE_STACK}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className={ADMIN_PAGE_KICKER}>
              {t.has("admin.dashboard.tabs.maintenance" as any) ? t("admin.dashboard.tabs.maintenance" as any) : "Maintenance"} / Vehicle History
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              {vehicle.name} {vehicle.plateNumber ? `(${vehicle.plateNumber})` : ""}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Full vehicle history with maintenance, compliance, downtime, and rental performance in one place.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">{vehicle.category.name}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">Status: {vehicle.status}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">Odometer: {vehicle.currentOdometerKm ?? "Not recorded"} km</span>
            </div>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href={`/${locale}/admin/maintenance`}>Back to maintenance</Link>
          </Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-5">
          {[
            { label: "Tracked costs", value: formatCurrency(profitability.costs.totalTrackedVehicleCosts), icon: BadgeDollarSign, tone: "text-sky-600 bg-sky-50" },
            { label: "Revenue", value: formatCurrency(profitability.revenue.totalRevenue), icon: HandCoins, tone: "text-violet-600 bg-violet-50" },
            { label: "Net contribution", value: formatCurrency(profitability.netContribution), icon: ShieldCheck, tone: "text-emerald-600 bg-emerald-50" },
            { label: "Confirmed bookings", value: profitability.revenue.assignedBookingCount, icon: CalendarRange, tone: "text-amber-600 bg-amber-50" },
            { label: "Cost per km", value: profitability.costs.costPerKm ? formatCurrency(profitability.costs.costPerKm) : "-", icon: CarFront, tone: "text-slate-700 bg-slate-100" },
          ].map((item) => (
            <Card key={item.label} className="rounded-[1.6rem] border-slate-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{item.value}</p>
                </div>
                <div className={`inline-flex size-12 items-center justify-center rounded-2xl ${item.tone}`}>
                  <item.icon className="size-5" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <Card className="rounded-[1.8rem] border-slate-200 p-6">
            <h2 className="text-xl font-black tracking-tight text-slate-900">Financial breakdown</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                ["Purchase price", profitability.costs.purchasePrice],
                ["Maintenance cost", profitability.costs.totalMaintenanceCost],
                ["Repair cost", profitability.costs.totalRepairCost],
                ["Parts cost", profitability.costs.totalPartsCost],
                ["Labor cost", profitability.costs.totalLaborCost],
                ["Tire cost", profitability.costs.tireCosts],
                ["Insurance cost", profitability.costs.insuranceCosts],
                ["Inspection cost", profitability.costs.inspectionCosts],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{formatCurrency(Number(value))}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[1.8rem] border-slate-200 p-6">
            <h2 className="text-xl font-black tracking-tight text-slate-900">Compliance status</h2>
            <div className="mt-4 space-y-3">
              {[
                ["Maintenance", compliance.maintenance.status],
                ["Insurance", compliance.insurance.status],
                ["Inspection", compliance.inspection.status],
              ].map(([label, status]) => (
                <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <span className="font-medium text-slate-900">{label}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusTone(status as any)}`}>{status}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="rounded-[1.8rem] border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                <Wrench className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">Maintenance history</h2>
                <p className="text-sm text-slate-600">{maintenanceRecords.length} records</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {maintenanceRecords.length === 0 ? (
                <p className="text-sm text-slate-500">No maintenance history yet.</p>
              ) : maintenanceRecords.map((record) => (
                <div key={record.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{record.title}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {formatDate(record.serviceDate)} · {record.serviceType}{record.maintenanceCategory ? ` · ${record.maintenanceCategory}` : ""}{record.odometerKm ? ` · ${record.odometerKm} km` : ""}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">{record.vendorName || "No vendor recorded"}</p>
                      {record.notes ? <p className="mt-2 text-sm text-slate-500">{record.notes}</p> : null}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(record.totalCost)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[1.8rem] border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                <ClipboardList className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">Rental revenue history</h2>
                <p className="text-sm text-slate-600">{bookings.length} confirmed bookings</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {bookings.length === 0 ? (
                <p className="text-sm text-slate-500">No confirmed booking history yet.</p>
              ) : bookings.map((booking) => (
                <div key={booking.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/${locale}/admin/bookings/${booking.id}`} className="font-semibold text-slate-900 hover:text-sky-700 hover:underline">
                        Booking {booking.bookingCode}
                      </Link>
                      <p className="mt-1 text-xs text-slate-600">
                        {booking.customerName} · {formatDate(booking.startDate)} to {formatDate(booking.endDate)}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Delivered: {booking.deliveredAt ? formatDate(booking.deliveredAt) : "Not marked"} · Returned: {booking.returnedAt ? formatDate(booking.returnedAt) : "Not marked"}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(booking.totalAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="rounded-[1.8rem] border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900">Insurance history</h2>
            <div className="mt-4 space-y-3">
              {insuranceRecords.length === 0 ? (
                <p className="text-sm text-slate-500">No insurance records yet.</p>
              ) : insuranceRecords.map((record) => (
                <div key={record.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{record.providerName}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {formatDate(record.startDate)} to {formatDate(record.endDate)}{record.coverageType ? ` · ${record.coverageType}` : ""}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">Premium: {record.premiumAmount != null ? formatCurrency(record.premiumAmount) : "-"}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[1.8rem] border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900">Inspection history</h2>
            <div className="mt-4 space-y-3">
              {inspectionRecords.length === 0 ? (
                <p className="text-sm text-slate-500">No inspection records yet.</p>
              ) : inspectionRecords.map((record) => (
                <div key={record.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{record.inspectionType || "Inspection"}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {formatDate(record.inspectionDate)}{record.expiryDate ? ` · Expires ${formatDate(record.expiryDate)}` : ""}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {record.authorityOrVendorName || "No vendor recorded"} · {record.cost != null ? formatCurrency(record.cost) : "-"}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[1.8rem] border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900">Downtime and unavailability</h2>
            <div className="mt-4 space-y-3">
              {downtimeRecords.length === 0 ? (
                <p className="text-sm text-slate-500">No downtime records yet.</p>
              ) : downtimeRecords.map((record) => (
                <div key={record.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{record.type}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {formatDate(record.startDate)} to {record.endDate ? formatDate(record.endDate) : "Open-ended"}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{record.reason || "No reason recorded"}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

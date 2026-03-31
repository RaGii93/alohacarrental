"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle, BadgeDollarSign, CalendarClock, ClipboardPlus, HandCoins, ShieldCheck, Wrench } from "lucide-react";
import { toast } from "sonner";
import {
  createVehicleInspectionRecordAction,
  createVehicleInsuranceRecordAction,
  createVehicleMaintenanceRecordAction,
} from "@/actions/fleet-operations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/pricing";

type VehicleOption = {
  id: string;
  name: string;
  plateNumber: string | null;
  currentOdometerKm: number | null;
};

type TemplateOption = {
  id: string;
  name: string;
  type: "SMALL" | "BIG" | "CUSTOM";
};

type InventoryPartOption = {
  id: string;
  name: string;
  quantityInStock: number;
};

type ReminderVehicle = {
  id: string;
  name: string;
  plateNumber: string | null;
  maintenanceStatus: "OK" | "DUE_SOON" | "OVERDUE" | "UNKNOWN";
  smallServiceStatus: "OK" | "DUE_SOON" | "OVERDUE" | "UNKNOWN";
  bigServiceStatus: "OK" | "DUE_SOON" | "OVERDUE" | "UNKNOWN";
  insuranceStatus: "OK" | "DUE_SOON" | "OVERDUE" | "UNKNOWN";
  inspectionStatus: "OK" | "DUE_SOON" | "OVERDUE" | "UNKNOWN";
  insuranceExpiryDate?: string | null;
  inspectionExpiryDate?: string | null;
};

type RecentRecord = {
  id: string;
  vehicleId: string;
  vehicleName: string;
  plateNumber: string | null;
  title: string;
  serviceType: string;
  maintenanceCategory: string | null;
  serviceDate: string;
  totalCost: number;
  vendorName: string | null;
};

type Summary = {
  totalVehicles: number;
  dueSoonVehicles: number;
  overdueVehicles: number;
  lowStockParts: number;
  totalTrackedVehicleCosts: number;
  totalRevenue: number;
  netContribution: number;
};

function statusTone(status: ReminderVehicle["maintenanceStatus"]) {
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

function isoDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function vehicleHistoryHref(locale: string, vehicleId: string) {
  return `/${locale}/admin/maintenance/vehicles/${vehicleId}`;
}

export function MaintenanceOverviewClient({
  locale,
  summary,
  vehicles,
  templates,
  inventoryParts,
  dueSoon,
  overdue,
  recentRecords,
}: {
  locale: string;
  summary: Summary;
  vehicles: VehicleOption[];
  templates: TemplateOption[];
  inventoryParts: InventoryPartOption[];
  dueSoon: ReminderVehicle[];
  overdue: ReminderVehicle[];
  recentRecords: RecentRecord[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const [inspectionOpen, setInspectionOpen] = useState(false);

  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [templateId, setTemplateId] = useState<string>("");
  const [serviceType, setServiceType] = useState<"SMALL" | "BIG" | "CUSTOM" | "REPAIR" | "INSPECTION_PREP" | "INSURANCE_RELATED">("SMALL");
  const [title, setTitle] = useState("");
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [odometerKm, setOdometerKm] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [laborCost, setLaborCost] = useState("");
  const [notes, setNotes] = useState("");
  const [createUnavailability, setCreateUnavailability] = useState(false);
  const [unavailableStart, setUnavailableStart] = useState(new Date().toISOString().slice(0, 10));
  const [unavailableEnd, setUnavailableEnd] = useState("");
  const [partRows, setPartRows] = useState<Array<{ inventoryPartId: string; customPartName: string; quantity: string; unitCost: string }>>([
    { inventoryPartId: "", customPartName: "", quantity: "1", unitCost: "" },
  ]);

  const [insuranceVehicleId, setInsuranceVehicleId] = useState(vehicles[0]?.id ?? "");
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState("");
  const [insuranceCoverageType, setInsuranceCoverageType] = useState("");
  const [insuranceStartDate, setInsuranceStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [insuranceEndDate, setInsuranceEndDate] = useState("");
  const [insurancePremium, setInsurancePremium] = useState("");
  const [insuranceNotes, setInsuranceNotes] = useState("");

  const [inspectionVehicleId, setInspectionVehicleId] = useState(vehicles[0]?.id ?? "");
  const [inspectionType, setInspectionType] = useState("");
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().slice(0, 10));
  const [inspectionExpiryDate, setInspectionExpiryDate] = useState("");
  const [inspectionVendor, setInspectionVendor] = useState("");
  const [inspectionCost, setInspectionCost] = useState("");
  const [inspectionNotes, setInspectionNotes] = useState("");

  const selectedVehicle = useMemo(() => vehicles.find((vehicle) => vehicle.id === vehicleId), [vehicleId, vehicles]);
  const partsCostPreview = partRows.reduce((sum, row) => sum + (Number(row.quantity || 0) * Number(row.unitCost || 0)), 0);
  const totalCostPreview = partsCostPreview + Number(laborCost || 0);

  const resetMaintenanceForm = () => {
    setTemplateId("");
    setServiceType("SMALL");
    setTitle("");
    setServiceDate(new Date().toISOString().slice(0, 10));
    setOdometerKm("");
    setVendorName("");
    setLaborCost("");
    setNotes("");
    setCreateUnavailability(false);
    setUnavailableStart(new Date().toISOString().slice(0, 10));
    setUnavailableEnd("");
    setPartRows([{ inventoryPartId: "", customPartName: "", quantity: "1", unitCost: "" }]);
  };

  const submitMaintenance = () => {
    startTransition(async () => {
      const result = await createVehicleMaintenanceRecordAction({
        vehicleId,
        maintenanceTemplateId: templateId || undefined,
        serviceType,
        title,
        serviceDate,
        odometerKm: odometerKm ? Number(odometerKm) : undefined,
        vendorName,
        laborCost: laborCost ? Number(laborCost) : undefined,
        notes,
        createUnavailability,
        unavailableStart: createUnavailability ? unavailableStart : undefined,
        unavailableEnd: createUnavailability ? unavailableEnd || undefined : undefined,
        parts: partRows.map((row) => ({
          inventoryPartId: row.inventoryPartId || undefined,
          customPartName: row.customPartName || undefined,
          quantity: Number(row.quantity || 0),
          unitCost: Number(row.unitCost || 0),
        })),
      }, locale);

      if (!result.success) {
        toast.error(result.error || t("admin.maintenance.messages.saveRecordFailed"));
        return;
      }

      toast.success(t("admin.maintenance.messages.recordSaved"));
      resetMaintenanceForm();
      setMaintenanceOpen(false);
      router.refresh();
    });
  };

  const submitInsurance = () => {
    startTransition(async () => {
      const result = await createVehicleInsuranceRecordAction({
        vehicleId: insuranceVehicleId,
        providerName: insuranceProvider,
        policyNumber: insurancePolicyNumber,
        coverageType: insuranceCoverageType,
        startDate: insuranceStartDate,
        endDate: insuranceEndDate,
        premiumAmount: insurancePremium ? Number(insurancePremium) : undefined,
        notes: insuranceNotes,
      }, locale);

      if (!result.success) {
        toast.error(result.error || t("admin.maintenance.messages.saveInsuranceFailed"));
        return;
      }

      toast.success(t("admin.maintenance.messages.insuranceSaved"));
      setInsuranceOpen(false);
      router.refresh();
    });
  };

  const submitInspection = () => {
    startTransition(async () => {
      const result = await createVehicleInspectionRecordAction({
        vehicleId: inspectionVehicleId,
        inspectionType,
        inspectionDate,
        expiryDate: inspectionExpiryDate || undefined,
        authorityOrVendorName: inspectionVendor,
        cost: inspectionCost ? Number(inspectionCost) : undefined,
        notes: inspectionNotes,
      }, locale);

      if (!result.success) {
        toast.error(result.error || t("admin.maintenance.messages.saveInspectionFailed"));
        return;
      }

      toast.success(t("admin.maintenance.messages.inspectionSaved"));
      setInspectionOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-5">
        {[
          { label: t("admin.maintenance.cards.overdueVehicles"), value: summary.overdueVehicles, icon: AlertTriangle, tone: "text-rose-600 bg-rose-50" },
          { label: t("admin.maintenance.cards.dueSoon"), value: summary.dueSoonVehicles, icon: CalendarClock, tone: "text-amber-600 bg-amber-50" },
          { label: t("admin.maintenance.cards.trackedCosts"), value: formatCurrency(summary.totalTrackedVehicleCosts), icon: BadgeDollarSign, tone: "text-sky-600 bg-sky-50" },
          { label: t("admin.maintenance.cards.vehicleRevenue"), value: formatCurrency(summary.totalRevenue), icon: HandCoins, tone: "text-violet-600 bg-violet-50" },
          { label: t("admin.maintenance.cards.netContribution"), value: formatCurrency(summary.netContribution), icon: ShieldCheck, tone: "text-emerald-600 bg-emerald-50" },
        ].map((item) => (
          <Card key={item.label} className="admin-surface-soft rounded-[1.6rem] border-transparent p-5">
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card className="admin-surface rounded-[1.8rem] border-transparent p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">{t("admin.maintenance.workspace.kicker")}</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">{t("admin.maintenance.workspace.title")}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                {t("admin.maintenance.workspace.description")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Dialog open={maintenanceOpen} onOpenChange={setMaintenanceOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl">
                    <ClipboardPlus className="size-4" />
                    {t("admin.maintenance.actions.logMaintenance")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t("admin.maintenance.dialogs.maintenance.title")}</DialogTitle>
                    <DialogDescription>
                      {t("admin.maintenance.dialogs.maintenance.description")}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-6 py-2">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium">{t("admin.maintenance.form.vehicle")}</label>
                        <Select value={vehicleId} onValueChange={setVehicleId}>
                          <SelectTrigger className="w-full rounded-xl">
                            <SelectValue placeholder={t("admin.maintenance.form.selectVehicle")} />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicles.map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.id}>
                                {vehicle.name} {vehicle.plateNumber ? `(${vehicle.plateNumber})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedVehicle ? (
                          <p className="mt-2 text-xs text-slate-500">
                            {t("admin.maintenance.form.currentOdometer", { value: selectedVehicle.currentOdometerKm ?? t("admin.maintenance.form.notRecorded") })}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">{t("admin.maintenance.form.template")}</label>
                        <Select value={templateId || "none"} onValueChange={(value) => setTemplateId(value === "none" ? "" : value)}>
                          <SelectTrigger className="w-full rounded-xl">
                            <SelectValue placeholder={t("admin.maintenance.form.optionalTemplate")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t("admin.maintenance.form.noTemplate")}</SelectItem>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">{t("admin.maintenance.form.recordType")}</label>
                        <Select value={serviceType} onValueChange={(value: any) => setServiceType(value)}>
                          <SelectTrigger className="w-full rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SMALL">{t("admin.maintenance.serviceTypes.small")}</SelectItem>
                            <SelectItem value="BIG">{t("admin.maintenance.serviceTypes.big")}</SelectItem>
                            <SelectItem value="REPAIR">{t("admin.maintenance.serviceTypes.repair")}</SelectItem>
                            <SelectItem value="CUSTOM">{t("admin.maintenance.serviceTypes.custom")}</SelectItem>
                            <SelectItem value="INSPECTION_PREP">{t("admin.maintenance.serviceTypes.inspectionPrep")}</SelectItem>
                            <SelectItem value="INSURANCE_RELATED">{t("admin.maintenance.serviceTypes.insuranceRelated")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">{t("admin.maintenance.form.serviceDate")}</label>
                        <Input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">{t("admin.maintenance.form.title")}</label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("admin.maintenance.form.titlePlaceholder")} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">{t("admin.maintenance.form.vendor")}</label>
                        <Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder={t("admin.maintenance.form.vendorPlaceholder")} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">{t("admin.maintenance.form.odometerKm")}</label>
                        <Input type="number" min={0} value={odometerKm} onChange={(e) => setOdometerKm(e.target.value)} />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">{t("admin.maintenance.form.laborCost")}</label>
                        <Input type="number" min={0} step="0.01" value={laborCost} onChange={(e) => setLaborCost(e.target.value)} placeholder="0.00" />
                      </div>
                    </div>

                    <div className="rounded-[1.4rem] border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">{t("admin.maintenance.parts.title")}</h3>
                          <p className="text-xs text-slate-500">{t("admin.maintenance.parts.description")}</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => setPartRows((rows) => [...rows, { inventoryPartId: "", customPartName: "", quantity: "1", unitCost: "" }])}
                        >
                          {t("admin.maintenance.parts.addLine")}
                        </Button>
                      </div>
                      <div className="mt-4 space-y-3">
                        {partRows.map((row, index) => (
                          <div key={index} className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_110px_130px]">
                            <Select
                              value={row.inventoryPartId || "custom"}
                              onValueChange={(value) =>
                                setPartRows((rows) =>
                                  rows.map((entry, entryIndex) =>
                                    entryIndex === index
                                      ? { ...entry, inventoryPartId: value === "custom" ? "" : value }
                                      : entry
                                  )
                                )
                              }
                            >
                              <SelectTrigger className="w-full rounded-xl bg-white">
                                <SelectValue placeholder={t("admin.maintenance.parts.inventoryPart")} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="custom">{t("admin.maintenance.parts.customNotInStock")}</SelectItem>
                                {inventoryParts.map((part) => (
                                  <SelectItem key={part.id} value={part.id}>
                                    {part.name} ({part.quantityInStock} in stock)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              value={row.customPartName}
                              onChange={(e) =>
                                setPartRows((rows) =>
                                  rows.map((entry, entryIndex) =>
                                    entryIndex === index ? { ...entry, customPartName: e.target.value } : entry
                                  )
                                )
                              }
                              placeholder={t("admin.maintenance.parts.customPartName")}
                            />
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={row.quantity}
                              onChange={(e) =>
                                setPartRows((rows) =>
                                  rows.map((entry, entryIndex) =>
                                    entryIndex === index ? { ...entry, quantity: e.target.value } : entry
                                  )
                                )
                              }
                              placeholder={t("admin.maintenance.parts.qty")}
                            />
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={row.unitCost}
                              onChange={(e) =>
                                setPartRows((rows) =>
                                  rows.map((entry, entryIndex) =>
                                    entryIndex === index ? { ...entry, unitCost: e.target.value } : entry
                                  )
                                )
                              }
                              placeholder={t("admin.maintenance.parts.unitCost")}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_300px]">
                      <div>
                        <label className="mb-1 block text-sm font-medium">{t("admin.maintenance.form.notes")}</label>
                        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("admin.maintenance.form.notesPlaceholder")} />
                      </div>
                      <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-900">{t("admin.maintenance.costSummary.title")}</p>
                        <div className="mt-3 space-y-2 text-sm text-slate-600">
                          <div className="flex items-center justify-between"><span>{t("admin.maintenance.costSummary.parts")}</span><span className="font-semibold text-slate-900">${partsCostPreview.toFixed(2)}</span></div>
                          <div className="flex items-center justify-between"><span>{t("admin.maintenance.costSummary.labor")}</span><span className="font-semibold text-slate-900">${Number(laborCost || 0).toFixed(2)}</span></div>
                          <div className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-3 text-white"><span>{t("admin.maintenance.costSummary.total")}</span><span className="font-semibold">${totalCostPreview.toFixed(2)}</span></div>
                        </div>
                        <label className="mt-4 flex items-start gap-3 text-sm text-slate-700">
                          <input type="checkbox" checked={createUnavailability} onChange={(e) => setCreateUnavailability(e.target.checked)} className="mt-1" />
                          <span>{t("admin.maintenance.form.markUnavailable")}</span>
                        </label>
                        {createUnavailability ? (
                          <div className="mt-3 grid gap-3">
                            <Input type="date" value={unavailableStart} onChange={(e) => setUnavailableStart(e.target.value)} />
                            <Input type="date" value={unavailableEnd} onChange={(e) => setUnavailableEnd(e.target.value)} />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setMaintenanceOpen(false)}>
                      {t("common.cancel")}
                    </Button>
                    <Button type="button" onClick={submitMaintenance} disabled={isPending}>
                      {t("admin.maintenance.actions.saveRecord")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={insuranceOpen} onOpenChange={setInsuranceOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="rounded-xl">
                    {t("admin.maintenance.actions.addInsurance")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{t("admin.maintenance.dialogs.insurance.title")}</DialogTitle>
                    <DialogDescription>{t("admin.maintenance.dialogs.insurance.description")}</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Select value={insuranceVehicleId} onValueChange={setInsuranceVehicleId}>
                      <SelectTrigger className="w-full rounded-xl"><SelectValue placeholder={t("admin.maintenance.form.vehicle")} /></SelectTrigger>
                      <SelectContent>{vehicles.map((vehicle) => <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input value={insuranceProvider} onChange={(e) => setInsuranceProvider(e.target.value)} placeholder={t("admin.maintenance.insurance.provider")} />
                    <Input value={insurancePolicyNumber} onChange={(e) => setInsurancePolicyNumber(e.target.value)} placeholder={t("admin.maintenance.insurance.policyNumber")} />
                    <Input value={insuranceCoverageType} onChange={(e) => setInsuranceCoverageType(e.target.value)} placeholder={t("admin.maintenance.insurance.coverageType")} />
                    <Input type="date" value={insuranceStartDate} onChange={(e) => setInsuranceStartDate(e.target.value)} />
                    <Input type="date" value={insuranceEndDate} onChange={(e) => setInsuranceEndDate(e.target.value)} />
                    <Input type="number" min={0} step="0.01" value={insurancePremium} onChange={(e) => setInsurancePremium(e.target.value)} placeholder={t("admin.maintenance.insurance.premiumAmount")} />
                  </div>
                  <Textarea value={insuranceNotes} onChange={(e) => setInsuranceNotes(e.target.value)} placeholder={t("admin.maintenance.insurance.notes")} />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setInsuranceOpen(false)}>{t("common.cancel")}</Button>
                    <Button type="button" onClick={submitInsurance} disabled={isPending}>{t("admin.maintenance.actions.saveInsurance")}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={inspectionOpen} onOpenChange={setInspectionOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="rounded-xl">
                    {t("admin.maintenance.actions.addInspection")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{t("admin.maintenance.dialogs.inspection.title")}</DialogTitle>
                    <DialogDescription>{t("admin.maintenance.dialogs.inspection.description")}</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Select value={inspectionVehicleId} onValueChange={setInspectionVehicleId}>
                      <SelectTrigger className="w-full rounded-xl"><SelectValue placeholder={t("admin.maintenance.form.vehicle")} /></SelectTrigger>
                      <SelectContent>{vehicles.map((vehicle) => <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input value={inspectionType} onChange={(e) => setInspectionType(e.target.value)} placeholder={t("admin.maintenance.inspection.type")} />
                    <Input type="date" value={inspectionDate} onChange={(e) => setInspectionDate(e.target.value)} />
                    <Input type="date" value={inspectionExpiryDate} onChange={(e) => setInspectionExpiryDate(e.target.value)} />
                    <Input value={inspectionVendor} onChange={(e) => setInspectionVendor(e.target.value)} placeholder={t("admin.maintenance.inspection.vendor")} />
                    <Input type="number" min={0} step="0.01" value={inspectionCost} onChange={(e) => setInspectionCost(e.target.value)} placeholder={t("admin.maintenance.inspection.cost")} />
                  </div>
                  <Textarea value={inspectionNotes} onChange={(e) => setInspectionNotes(e.target.value)} placeholder={t("admin.maintenance.inspection.notes")} />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setInspectionOpen(false)}>{t("common.cancel")}</Button>
                    <Button type="button" onClick={submitInspection} disabled={isPending}>{t("admin.maintenance.actions.saveInspection")}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </Card>

        <Card className="rounded-[1.8rem] border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <Wrench className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{t("admin.maintenance.reminderSnapshot.title")}</h3>
              <p className="text-sm text-slate-600">
                {t("admin.maintenance.reminderSnapshot.description", { overdue: summary.overdueVehicles, count: summary.lowStockParts })}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[1.8rem] border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900">{t("admin.maintenance.tables.overdueItems")}</h3>
          <div className="mt-4 space-y-3">
            {overdue.length === 0 ? (
              <p className="text-sm text-slate-500">{t("admin.maintenance.empty.noOverdue")}</p>
            ) : overdue.map((vehicle) => (
              <div key={vehicle.id} className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link href={vehicleHistoryHref(locale, vehicle.id)} className="font-semibold text-slate-900 hover:text-sky-700 hover:underline">
                      {vehicle.name} {vehicle.plateNumber ? `(${vehicle.plateNumber})` : ""}
                    </Link>
                    <p className="mt-1 text-xs text-slate-600">
                      {t("admin.maintenance.statusLine", { insurance: vehicle.insuranceStatus, inspection: vehicle.inspectionStatus, maintenance: vehicle.maintenanceStatus })}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusTone("OVERDUE")}`}>{t("admin.maintenance.badges.overdue")}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[1.8rem] border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900">{t("admin.maintenance.tables.dueSoon")}</h3>
          <div className="mt-4 space-y-3">
            {dueSoon.length === 0 ? (
              <p className="text-sm text-slate-500">{t("admin.maintenance.empty.nothingDueSoon")}</p>
            ) : dueSoon.map((vehicle) => (
              <div key={vehicle.id} className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link href={vehicleHistoryHref(locale, vehicle.id)} className="font-semibold text-slate-900 hover:text-sky-700 hover:underline">
                      {vehicle.name} {vehicle.plateNumber ? `(${vehicle.plateNumber})` : ""}
                    </Link>
                    <p className="mt-1 text-xs text-slate-600">
                      {t("admin.maintenance.expiryLine", {
                        insurance: vehicle.insuranceExpiryDate ? isoDate(vehicle.insuranceExpiryDate) : t("admin.maintenance.form.notSet"),
                        inspection: vehicle.inspectionExpiryDate ? isoDate(vehicle.inspectionExpiryDate) : t("admin.maintenance.form.notSet"),
                      })}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusTone("DUE_SOON")}`}>{t("admin.maintenance.badges.dueSoon")}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="rounded-[1.8rem] border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900">{t("admin.maintenance.tables.recentHistory")}</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="pb-3 font-medium">{t("admin.maintenance.table.date")}</th>
                <th className="pb-3 font-medium">{t("admin.maintenance.table.vehicle")}</th>
                <th className="pb-3 font-medium">{t("admin.maintenance.table.record")}</th>
                <th className="pb-3 font-medium">{t("admin.maintenance.table.vendor")}</th>
                <th className="pb-3 font-medium">{t("admin.maintenance.table.cost")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentRecords.map((record) => (
                <tr key={record.id}>
                  <td className="py-3 text-slate-600">{isoDate(record.serviceDate)}</td>
                  <td className="py-3 font-medium text-slate-900">
                    <Link href={vehicleHistoryHref(locale, record.vehicleId)} className="hover:text-sky-700 hover:underline">
                      {record.vehicleName} {record.plateNumber ? `(${record.plateNumber})` : ""}
                    </Link>
                  </td>
                  <td className="py-3">
                    <div className="font-medium text-slate-900">{record.title}</div>
                    <div className="text-xs text-slate-500">{record.serviceType} {record.maintenanceCategory ? `· ${record.maintenanceCategory}` : ""}</div>
                  </td>
                  <td className="py-3 text-slate-600">{record.vendorName || "-"}</td>
                  <td className="py-3 font-semibold text-slate-900">{formatCurrency(record.totalCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Camera, ChevronLeft, ChevronRight, Fuel, Gauge, Receipt, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { completeExternalRentalInspectionAction } from "@/actions/external-rentals";
import { uploadInspectionImageAction } from "@/actions/booking";
import { FUEL_LEVEL_OPTIONS, formatCurrency, getFuelLevelLabel } from "@/lib/pricing";
import { getBlobProxyUrl } from "@/lib/blob";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "pickup" | "return";
  rentalId: string;
  bookingCode: string;
  locale: string;
  initialOdometerKm?: number | null;
  initialFuelLevel?: number | null;
  onCompleted?: () => void;
};

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file);
  const maxDimension = 1280;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.76));
  bitmap.close();
  if (!blob) return file;
  const nextName = file.name.replace(/\.[^.]+$/, "") || "inspection";
  return new File([blob], `${nextName}.jpg`, { type: "image/jpeg" });
}

function formatOdometerInput(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return String(Math.max(0, Math.round(value)));
}

export function PartnerRentalInspectionDialog({
  open,
  onOpenChange,
  mode,
  rentalId,
  bookingCode,
  locale,
  initialOdometerKm,
  initialFuelLevel,
  onCompleted,
}: Props) {
  const t = useTranslations();
  const isReturn = mode === "return";
  const [step, setStep] = useState(0);
  const [odometerKm, setOdometerKm] = useState("");
  const [fuelLevel, setFuelLevel] = useState(String(initialFuelLevel ?? 4));
  const [hasDamage, setHasDamage] = useState(false);
  const [damageNotes, setDamageNotes] = useState("");
  const [agentNotes, setAgentNotes] = useState("");
  const [acceptedBy, setAcceptedBy] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [checklistItemIds, setChecklistItemIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lateCharge, setLateCharge] = useState("0");
  const [fuelCharge, setFuelCharge] = useState("0");
  const [damageCharge, setDamageCharge] = useState("0");
  const [closeoutPaidOnSpot, setCloseoutPaidOnSpot] = useState(false);

  const checklistItems = isReturn
    ? [
        { id: "vehicle_exterior_rechecked", label: t("admin.bookings.detail.inspection.returnChecklist.items.vehicleExteriorRechecked") },
        { id: "vehicle_interior_rechecked", label: t("admin.bookings.detail.inspection.returnChecklist.items.vehicleInteriorRechecked") },
        { id: "fuel_level_rechecked", label: t("admin.bookings.detail.inspection.returnChecklist.items.fuelLevelRechecked") },
        { id: "damage_reviewed", label: t("admin.bookings.detail.inspection.returnChecklist.items.damageReviewed") },
        { id: "late_return_reviewed", label: t("admin.bookings.detail.inspection.returnChecklist.items.lateReturnReviewed") },
        { id: "extra_charges_explained", label: t("admin.bookings.detail.inspection.returnChecklist.items.extraChargesExplained") },
        { id: "keys_received", label: t("admin.bookings.detail.inspection.returnChecklist.items.keysReceived") },
        { id: "client_closeout_confirmed", label: t("admin.bookings.detail.inspection.returnChecklist.items.clientCloseoutConfirmed") },
      ]
    : [
        { id: "license_verified", label: t("admin.bookings.detail.inspection.checklist.items.licenseVerified") },
        { id: "vehicle_exterior_checked", label: t("admin.bookings.detail.inspection.checklist.items.vehicleExteriorChecked") },
        { id: "vehicle_interior_checked", label: t("admin.bookings.detail.inspection.checklist.items.vehicleInteriorChecked") },
        { id: "fuel_level_confirmed", label: t("admin.bookings.detail.inspection.checklist.items.fuelLevelConfirmed") },
        { id: "accessories_confirmed", label: t("admin.bookings.detail.inspection.checklist.items.accessoriesConfirmed") },
        { id: "rental_window_confirmed", label: t("admin.bookings.detail.inspection.checklist.items.rentalWindowConfirmed") },
        { id: "terms_explained", label: t("admin.bookings.detail.inspection.checklist.items.termsExplained") },
        { id: "client_received_vehicle", label: t("admin.bookings.detail.inspection.checklist.items.clientReceivedVehicle") },
      ];

  const finalStep = 3;

  const reset = () => {
    setStep(0);
    setOdometerKm(formatOdometerInput(initialOdometerKm));
    setFuelLevel(String(initialFuelLevel ?? 4));
    setHasDamage(false);
    setDamageNotes("");
    setAgentNotes("");
    setAcceptedBy("");
    setAccepted(false);
    setImageUrls([]);
    setChecklistItemIds([]);
    setUploading(false);
    setSaving(false);
    setLateCharge("0");
    setFuelCharge("0");
    setDamageCharge("0");
    setCloseoutPaidOnSpot(false);
  };

  useEffect(() => {
    if (!open) return;
    setOdometerKm(formatOdometerInput(initialOdometerKm));
    setFuelLevel(String(initialFuelLevel ?? 4));
  }, [initialFuelLevel, initialOdometerKm, open]);

  const close = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const validateStep = () => {
    if (step === 0) {
      if (!odometerKm || Number(odometerKm) < 0) {
        toast.error(t("admin.bookings.detail.inspection.validation.odometer"));
        return false;
      }
      if (!fuelLevel) {
        toast.error(t("admin.bookings.detail.inspection.validation.fuelLevel"));
        return false;
      }
      if (hasDamage && !damageNotes.trim()) {
        toast.error(t("admin.bookings.detail.inspection.validation.damageNotes"));
        return false;
      }
    }
    if (step === 1 && checklistItemIds.length !== checklistItems.length) {
      toast.error(t("admin.bookings.detail.inspection.validation.checklist"));
      return false;
    }
    if (step === finalStep) {
      if (!acceptedBy.trim()) {
        toast.error(t("admin.bookings.detail.inspection.validation.acceptedBy"));
        return false;
      }
      if (!accepted) {
        toast.error(t("admin.bookings.detail.inspection.validation.acceptance"));
        return false;
      }
    }
    return true;
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, Math.max(0, 6 - imageUrls.length))) {
        const compressed = await compressImage(file);
        const formData = new FormData();
        formData.append("image", compressed);
        const uploaded = await uploadInspectionImageAction(formData);
        if (!uploaded.success || !uploaded.imageUrl) {
          toast.error(uploaded.error || t("admin.bookings.detail.inspection.toasts.uploadFailed"));
          continue;
        }
        setImageUrls((prev) => [...prev, uploaded.imageUrl!]);
      }
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async () => {
    if (!validateStep()) return;
    setSaving(true);
    const result = await completeExternalRentalInspectionAction(
      rentalId,
      mode,
      {
        odometerKm: Number(odometerKm),
        fuelLevel: Number(fuelLevel),
        hasDamage,
        damageNotes,
        agentNotes,
        acceptedBy,
        imageUrls,
        checklistItemIds,
        lateChargeCents: Math.max(0, Math.round((Number(lateCharge || "0") || 0) * 100)),
        fuelChargeCents: Math.max(0, Math.round((Number(fuelCharge || "0") || 0) * 100)),
        damageChargeCents: Math.max(0, Math.round((Number(damageCharge || "0") || 0) * 100)),
        closeoutPaidOnSpot,
      },
      locale
    );
    setSaving(false);
    if (!result.success) {
      toast.error(result.error || t(`admin.bookings.detail.inspection.toasts.completeFailed.${mode}`));
      return;
    }
    toast.success(isReturn ? t("admin.partnerRentals.messages.updated") : t("admin.bookings.detail.inspection.toasts.pickupCompleted"));
    if ((result as any).warning) {
      toast.warning((result as any).warning);
    }
    close(false);
    onCompleted?.();
  };

  const title = isReturn
    ? t("admin.partnerRentals.flow.markDropoffTitle", { code: bookingCode })
    : t("admin.partnerRentals.flow.markPickupTitle", { code: bookingCode });

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t("admin.bookings.detail.inspection.description")}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`rounded-xl px-3 py-2 text-center text-xs font-semibold ${
                index === step ? "bg-slate-900 text-white" : index < step ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {[
                t("admin.bookings.detail.inspection.steps.condition"),
                t("admin.bookings.detail.inspection.steps.checklist"),
                t("admin.bookings.detail.inspection.steps.photos"),
                t("admin.bookings.detail.inspection.steps.acceptance"),
              ][index]}
            </div>
          ))}
        </div>

        {step === 0 ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">{t("admin.bookings.detail.inspection.vehicleState")}</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium"><span className="inline-flex items-center gap-2"><Gauge className="h-4 w-4" />{t("admin.bookings.detail.inspection.fields.odometer")}</span></label>
                  <Input value={odometerKm} onChange={(e) => setOdometerKm(e.target.value)} inputMode="numeric" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium"><span className="inline-flex items-center gap-2"><Fuel className="h-4 w-4" />{t("admin.bookings.detail.inspection.fields.fuelLevel")}</span></label>
                  <select
                    value={fuelLevel}
                    onChange={(e) => setFuelLevel(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {FUEL_LEVEL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{getFuelLevelLabel(option.value)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox checked={hasDamage} onCheckedChange={(checked) => setHasDamage(Boolean(checked))} />
                  {t("admin.bookings.detail.inspection.fields.damageToggle")}
                </label>
                <div>
                  <label className="mb-1 block text-sm font-medium">{t("admin.bookings.detail.inspection.fields.damageNotes")}</label>
                  <Textarea value={damageNotes} onChange={(e) => setDamageNotes(e.target.value)} placeholder={t("admin.bookings.detail.inspection.fields.damagePlaceholder")} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{t("admin.bookings.detail.inspection.fields.agentNotes")}</label>
                  <Textarea value={agentNotes} onChange={(e) => setAgentNotes(e.target.value)} placeholder={t("admin.bookings.detail.inspection.fields.agentNotesPlaceholder")} />
                </div>
              </div>
            </div>
            {isReturn ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="flex items-center gap-2 font-semibold text-slate-900">
                  <Receipt className="h-4 w-4" />
                  {t("admin.bookings.detail.inspection.summary.title")}
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-900">{t("admin.bookings.detail.inspection.summary.lateReturnCharge")}</label>
                    <Input type="number" min="0" step="0.01" value={lateCharge} onChange={(e) => setLateCharge(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-900">{t("admin.bookings.detail.inspection.summary.fuelChargePreview")}</label>
                    <Input type="number" min="0" step="0.01" value={fuelCharge} onChange={(e) => setFuelCharge(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-900">{t("admin.bookings.detail.inspection.summary.damageCharge")}</label>
                    <Input type="number" min="0" step="0.01" value={damageCharge} onChange={(e) => setDamageCharge(e.target.value)} />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              {t(isReturn ? "admin.bookings.detail.inspection.returnChecklist.description" : "admin.bookings.detail.inspection.checklist.description")}
            </p>
            <div className="grid gap-3">
              {checklistItems.map((item) => {
                const checked = checklistItemIds.includes(item.id);
                return (
                  <label key={item.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => {
                        setChecklistItemIds((prev) =>
                          value ? [...prev, item.id] : prev.filter((current) => current !== item.id)
                        );
                      }}
                    />
                    <span className="text-sm text-slate-800">{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{t("admin.bookings.detail.inspection.photos.title")}</p>
                <p className="text-sm text-slate-600">{t("admin.bookings.detail.inspection.photos.description")}</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                <Camera className="h-4 w-4" />
                {uploading ? t("admin.bookings.detail.inspection.photos.uploading") : t("admin.bookings.detail.inspection.photos.add")}
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => void uploadFiles(e.target.files)} />
              </label>
            </div>
            {imageUrls.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-3">
                {imageUrls.map((url) => (
                  <div key={url} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <img src={getBlobProxyUrl(url) || url} alt={t("admin.bookings.detail.inspection.photos.alt")} className="h-40 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrls((prev) => prev.filter((current) => current !== url))}
                      className="flex w-full items-center justify-center gap-2 border-t border-slate-200 px-3 py-2 text-sm text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("admin.bookings.detail.inspection.photos.remove")}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                {t("admin.bookings.detail.inspection.photos.empty")}
              </div>
            )}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="flex items-center justify-between"><span>{t("admin.bookings.detail.inspection.acceptance.odometer")}</span><span className="font-medium text-slate-900">{odometerKm || "-"}</span></div>
              <div className="mt-2 flex items-center justify-between"><span>{t("admin.bookings.detail.inspection.acceptance.fuel")}</span><span className="font-medium text-slate-900">{getFuelLevelLabel(Number(fuelLevel))}</span></div>
              <div className="mt-2 flex items-center justify-between"><span>{t("admin.bookings.detail.inspection.acceptance.damageRecorded")}</span><span className="font-medium text-slate-900">{hasDamage ? t("common.yes") : t("common.no")}</span></div>
              <div className="mt-2 flex items-center justify-between"><span>{t("admin.bookings.detail.inspection.acceptance.checklistCompleted")}</span><span className="font-medium text-slate-900">{checklistItemIds.length}/{checklistItems.length}</span></div>
              {isReturn ? (
                <>
                  <div className="mt-2 flex items-center justify-between"><span>{t("admin.bookings.detail.inspection.summary.lateReturnCharge")}</span><span className="font-medium text-slate-900">{formatCurrency(Math.max(0, Math.round((Number(lateCharge || "0") || 0) * 100)))}</span></div>
                  <div className="mt-2 flex items-center justify-between"><span>{t("admin.bookings.detail.inspection.summary.fuelChargePreview")}</span><span className="font-medium text-slate-900">{formatCurrency(Math.max(0, Math.round((Number(fuelCharge || "0") || 0) * 100)))}</span></div>
                  <div className="mt-2 flex items-center justify-between"><span>{t("admin.bookings.detail.inspection.summary.damageCharge")}</span><span className="font-medium text-slate-900">{formatCurrency(Math.max(0, Math.round((Number(damageCharge || "0") || 0) * 100)))}</span></div>
                  <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-900 px-3 py-3 text-white"><span>{t("admin.bookings.detail.inspection.acceptance.totalCloseout")}</span><span className="font-semibold">{formatCurrency(
                    Math.max(0, Math.round((Number(lateCharge || "0") || 0) * 100)) +
                    Math.max(0, Math.round((Number(fuelCharge || "0") || 0) * 100)) +
                    Math.max(0, Math.round((Number(damageCharge || "0") || 0) * 100))
                  )}</span></div>
                </>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t("admin.bookings.detail.inspection.acceptance.acceptedBy")}</label>
              <Input value={acceptedBy} onChange={(e) => setAcceptedBy(e.target.value)} placeholder={t("admin.bookings.detail.inspection.acceptance.acceptedByPlaceholder")} />
            </div>
            {isReturn ? (
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <Checkbox checked={closeoutPaidOnSpot} onCheckedChange={(checked) => setCloseoutPaidOnSpot(Boolean(checked))} />
                <span>{t("admin.bookings.detail.inspection.acceptance.closeoutPaidOnSpot")}</span>
              </label>
            ) : null}
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <Checkbox checked={accepted} onCheckedChange={(checked) => setAccepted(Boolean(checked))} />
              <span>{t("admin.bookings.detail.inspection.acceptance.checkbox")}</span>
            </label>
          </div>
        ) : null}

        <DialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => (step === 0 ? close(false) : setStep((prev) => prev - 1))}>
              <ChevronLeft className="h-4 w-4" />
              {step === 0 ? t("common.cancel") : t("common.back")}
            </Button>
          </div>
          {step < finalStep ? (
            <Button type="button" onClick={() => validateStep() && setStep((prev) => prev + 1)}>
              {t("common.next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" disabled={saving} onClick={onSubmit}>
              {saving ? t("common.loading") : (isReturn ? t("admin.bookings.detail.inspection.completeReturn") : t("admin.bookings.detail.inspection.completePickup"))}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

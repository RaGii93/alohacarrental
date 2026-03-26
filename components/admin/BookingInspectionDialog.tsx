"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Camera, CheckCircle2, ChevronLeft, ChevronRight, Fuel, Gauge, Trash2 } from "lucide-react";
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
import { completePickupInspectionAction, completeReturnInspectionAction, uploadInspectionImageAction } from "@/actions/booking";
import {
  calculateFuelDifferenceCharge,
  calculateLateReturnCharge,
  FUEL_LEVEL_OPTIONS,
  LATE_RETURN_GRACE_HOURS,
  formatCurrency,
  getFuelChargePerQuarterForCategory,
  getFuelLevelLabel,
} from "@/lib/pricing";
import { getBlobProxyUrl } from "@/lib/blob";
import { formatDateTime } from "@/lib/datetime";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "pickup" | "return";
  bookingId: string;
  locale: string;
  pickupFuelLevel?: number | null;
  categoryName?: string | null;
  dailyRate?: number | null;
  scheduledDropoffAt?: string | Date | null;
  fuelChargePerQuarter?: number | null;
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

export function BookingInspectionDialog({
  open,
  onOpenChange,
  mode,
  bookingId,
  locale,
  pickupFuelLevel,
  categoryName,
  dailyRate,
  scheduledDropoffAt,
  fuelChargePerQuarter,
  onCompleted,
}: Props) {
  const t = useTranslations();
  const isReturn = mode === "return";
  const [step, setStep] = useState(0);
  const [odometerKm, setOdometerKm] = useState("");
  const [fuelLevel, setFuelLevel] = useState(isReturn ? String(pickupFuelLevel ?? 4) : "4");
  const [hasDamage, setHasDamage] = useState(false);
  const [damageNotes, setDamageNotes] = useState("");
  const [agentNotes, setAgentNotes] = useState("");
  const [acceptedBy, setAcceptedBy] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [damageCharge, setDamageCharge] = useState("0");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fuelPreview = useMemo(
    () =>
      isReturn
        ? calculateFuelDifferenceCharge({
            pickupFuelLevel,
            returnFuelLevel: Number(fuelLevel),
            chargePerQuarterCents: getFuelChargePerQuarterForCategory({ fuelChargePerQuarter }),
          })
        : { missingQuarters: 0, chargeCents: 0 },
    [fuelChargePerQuarter, fuelLevel, isReturn, pickupFuelLevel]
  );
  const latePreview = useMemo(
    () =>
      isReturn && scheduledDropoffAt
        ? calculateLateReturnCharge({
            scheduledDropoffAt,
            actualReturnedAt: new Date(),
            dailyRateCents: dailyRate || 0,
          })
        : { isLate: false, lateMs: 0, lateDays: 0, chargeCents: 0 },
    [dailyRate, isReturn, scheduledDropoffAt]
  );

  const reset = () => {
    setStep(0);
    setOdometerKm("");
    setFuelLevel(isReturn ? String(pickupFuelLevel ?? 4) : "4");
    setHasDamage(false);
    setDamageNotes("");
    setAgentNotes("");
    setAcceptedBy("");
    setAccepted(false);
    setDamageCharge("0");
    setImageUrls([]);
    setUploading(false);
    setSaving(false);
  };

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

    if (step === 2) {
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

    const payload = {
      odometerKm: Number(odometerKm),
      fuelLevel: Number(fuelLevel),
      hasDamage,
      damageNotes,
      agentNotes,
      acceptedBy,
      imageUrls,
      damageChargeCents: Math.round((Number(damageCharge || "0") || 0) * 100),
    };

    const result = isReturn
      ? await completeReturnInspectionAction(bookingId, payload, locale)
      : await completePickupInspectionAction(bookingId, payload, locale);

    setSaving(false);
    if (!result.success) {
      toast.error(result.error || t(`admin.bookings.detail.inspection.toasts.completeFailed.${mode}`));
      return;
    }

    toast.success(
      isReturn
        ? t("admin.bookings.detail.inspection.toasts.returnCompleted", {
            amount: formatCurrency((result as any).totalAdjustment || 0),
          })
        : t("admin.bookings.detail.inspection.toasts.pickupCompleted")
    );
    reset();
    onOpenChange(false);
    onCompleted?.();
  };

  const title = isReturn
    ? t("admin.bookings.detail.inspection.title.return")
    : t("admin.bookings.detail.inspection.title.pickup");
  const steps = [
    t("admin.bookings.detail.inspection.steps.condition"),
    t("admin.bookings.detail.inspection.steps.photos"),
    t("admin.bookings.detail.inspection.steps.acceptance"),
  ];

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {t("admin.bookings.detail.inspection.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3">
          {steps.map((label, index) => (
            <div
              key={label}
              className={`rounded-2xl border px-4 py-3 text-sm ${index === step ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-600"}`}
            >
              <span className="font-semibold">{index + 1}.</span> {label}
            </div>
          ))}
        </div>

        {step === 0 ? (
          <div className="grid gap-4">
            {isReturn && latePreview.chargeCents > 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-900">
                <p className="font-semibold">{t("admin.bookings.detail.inspection.summary.lateBannerTitle")}</p>
                <p className="mt-1 text-sm">
                  {t("admin.bookings.detail.inspection.summary.lateBannerDescription", {
                    scheduled: formatDateTime(scheduledDropoffAt),
                    graceHours: LATE_RETURN_GRACE_HOURS,
                  })}
                </p>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-4 flex items-center gap-2 text-slate-900">
                <Gauge className="h-4 w-4" />
                <p className="font-semibold">{t("admin.bookings.detail.inspection.vehicleState")}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">{t("admin.bookings.detail.inspection.fields.odometer")}</label>
                  <Input type="number" min={0} value={odometerKm} onChange={(e) => setOdometerKm(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{t("admin.bookings.detail.inspection.fields.fuelLevel")}</label>
                  <select
                    value={fuelLevel}
                    onChange={(e) => setFuelLevel(e.target.value)}
                    className="h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-white px-3 text-sm"
                  >
                    {FUEL_LEVEL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <Checkbox checked={hasDamage} onCheckedChange={(value) => setHasDamage(Boolean(value))} id="damage-present" />
                  <label htmlFor="damage-present" className="text-sm text-slate-700">
                    {t("admin.bookings.detail.inspection.fields.damageToggle")}
                  </label>
                </div>
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

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-4 flex items-center gap-2 text-slate-900">
                <Fuel className="h-4 w-4" />
                <p className="font-semibold">{t("admin.bookings.detail.inspection.summary.title")}</p>
              </div>
              <div className="space-y-3 text-sm text-slate-600">
                {isReturn ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span>{t("admin.bookings.detail.inspection.summary.pickupFuel")}</span>
                      <span className="font-medium text-slate-900">{getFuelLevelLabel(pickupFuelLevel)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t("admin.bookings.detail.inspection.summary.returnFuel")}</span>
                      <span className="font-medium text-slate-900">{getFuelLevelLabel(Number(fuelLevel))}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t("admin.bookings.detail.inspection.summary.missingQuarters")}</span>
                      <span className="font-medium text-slate-900">{fuelPreview.missingQuarters}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t("admin.bookings.detail.inspection.summary.categoryRate")}</span>
                      <span className="font-medium text-slate-900">
                        {formatCurrency(getFuelChargePerQuarterForCategory({ fuelChargePerQuarter }))}/1/4
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t("admin.bookings.detail.inspection.summary.lateReturnCharge")}</span>
                      <span className="font-medium text-slate-900">{formatCurrency(latePreview.chargeCents)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t("admin.bookings.detail.inspection.summary.fuelChargePreview")}</span>
                      <span className="font-medium text-slate-900">{formatCurrency(fuelPreview.chargeCents)}</span>
                    </div>
                    {latePreview.chargeCents > 0 ? (
                      <p className="rounded-xl bg-amber-50 px-3 py-3 text-sm text-amber-900">
                        {t("admin.bookings.detail.inspection.summary.lateNotice", { days: latePreview.lateDays })}
                      </p>
                    ) : null}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-900">{t("admin.bookings.detail.inspection.summary.damageCharge")}</label>
                      <Input type="number" min={0} step={0.01} value={damageCharge} onChange={(e) => setDamageCharge(e.target.value)} />
                    </div>
                  </>
                ) : (
                  <p>{t("admin.bookings.detail.inspection.summary.pickupHelp")}</p>
                )}
              </div>
            </div>
          </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{t("admin.bookings.detail.inspection.photos.title")}</p>
                <p className="text-sm text-slate-600">{t("admin.bookings.detail.inspection.photos.description")}</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <Camera className="h-4 w-4" />
                {uploading ? t("admin.bookings.detail.inspection.photos.uploading") : t("admin.bookings.detail.inspection.photos.add")}
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadFiles(e.target.files)} />
              </label>
            </div>

            {imageUrls.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {imageUrls.map((url) => (
                  <div key={url} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    <img src={getBlobProxyUrl(url) || url} alt={t("admin.bookings.detail.inspection.photos.alt")} className="h-40 w-full object-cover" />
                    <div className="flex items-center justify-end p-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => setImageUrls((prev) => prev.filter((item) => item !== url))}>
                        <Trash2 className="h-4 w-4" />
                        {t("admin.bookings.detail.inspection.photos.remove")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                {t("admin.bookings.detail.inspection.photos.empty")}
              </p>
            )}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">{t("admin.bookings.detail.inspection.acceptance.clientOverview")}</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between"><span>{t("admin.bookings.detail.inspection.acceptance.odometer")}</span><span className="font-medium text-slate-900">{odometerKm || "-"}</span></div>
                <div className="flex items-center justify-between"><span>{t("admin.bookings.detail.inspection.acceptance.fuel")}</span><span className="font-medium text-slate-900">{getFuelLevelLabel(Number(fuelLevel))}</span></div>
                <div className="flex items-center justify-between"><span>{t("admin.bookings.detail.inspection.acceptance.damageRecorded")}</span><span className="font-medium text-slate-900">{hasDamage ? t("common.yes") : t("common.no")}</span></div>
                {damageNotes.trim() ? <p className="rounded-xl bg-slate-50 px-3 py-3">{damageNotes}</p> : null}
                {isReturn ? (
                  <>
                    <div className="flex items-center justify-between"><span>{t("admin.bookings.detail.inspection.acceptance.category")}</span><span className="font-medium text-slate-900">{categoryName || "-"}</span></div>
                    <div className="flex items-center justify-between"><span>{t("admin.bookings.detail.inspection.summary.lateReturnCharge")}</span><span className="font-medium text-slate-900">{formatCurrency(latePreview.chargeCents)}</span></div>
                    <div className="flex items-center justify-between"><span>{t("admin.bookings.detail.inspection.acceptance.fuelCharge")}</span><span className="font-medium text-slate-900">{formatCurrency(fuelPreview.chargeCents)}</span></div>
                    <div className="flex items-center justify-between"><span>{t("admin.bookings.detail.inspection.summary.damageCharge")}</span><span className="font-medium text-slate-900">{formatCurrency(Math.round((Number(damageCharge || "0") || 0) * 100))}</span></div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-3 text-white"><span>{t("admin.bookings.detail.inspection.acceptance.totalCloseout")}</span><span className="font-semibold">{formatCurrency(latePreview.chargeCents + fuelPreview.chargeCents + Math.round((Number(damageCharge || "0") || 0) * 100))}</span></div>
                  </>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-4 flex items-center gap-2 text-slate-900">
                <CheckCircle2 className="h-4 w-4" />
                <p className="font-semibold">{t("admin.bookings.detail.inspection.acceptance.title")}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">{t("admin.bookings.detail.inspection.acceptance.acceptedBy")}</label>
                  <Input value={acceptedBy} onChange={(e) => setAcceptedBy(e.target.value)} placeholder={t("admin.bookings.detail.inspection.acceptance.acceptedByPlaceholder")} />
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <Checkbox checked={accepted} onCheckedChange={(value) => setAccepted(Boolean(value))} id="accepted-confirm" />
                  <label htmlFor="accepted-confirm" className="text-sm text-slate-700">
                    {t("admin.bookings.detail.inspection.acceptance.checkbox")}
                  </label>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter className="sm:justify-between">
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => close(false)} disabled={saving || uploading}>
              {t("common.cancel")}
            </Button>
            {step > 0 ? (
              <Button type="button" variant="outline" onClick={() => setStep((prev) => prev - 1)} disabled={saving || uploading}>
                <ChevronLeft className="h-4 w-4" />
                {t("common.previous")}
              </Button>
            ) : null}
          </div>
          <div className="flex gap-2">
            {step < steps.length - 1 ? (
              <Button
                type="button"
                onClick={() => {
                  if (!validateStep()) return;
                  setStep((prev) => prev + 1);
                }}
                disabled={saving || uploading}
              >
                {t("common.next")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={onSubmit} disabled={saving || uploading}>
                {saving ? t("common.loading") : isReturn ? t("admin.bookings.detail.inspection.completeReturn") : t("admin.bookings.detail.inspection.completePickup")}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

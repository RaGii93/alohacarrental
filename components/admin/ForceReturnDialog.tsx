"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { markBookingReturnedAction } from "@/actions/booking";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { calculateLateReturnCharge, formatCurrency } from "@/lib/pricing";
import { formatDateTimeInputInLaPaz, parseLaPazDateTimeInput } from "@/lib/timezone";

export function ForceReturnDialog({ open, onOpenChange, bookingId, locale, endDate, dailyRate, totalAmount, onCompleted }: {
  open: boolean; onOpenChange: (open: boolean) => void; bookingId: string; locale: string;
  endDate: Date | string; dailyRate: number; totalAmount: number; onCompleted: () => void;
}) {
  const t = useTranslations("bookingOperations");
  const [actualReturnedAt, setActualReturnedAt] = useState("");
  const [reason, setReason] = useState("");
  const [keepAgreedPrice, setKeepAgreedPrice] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) { setActualReturnedAt(formatDateTimeInputInLaPaz(new Date())); setReason(""); setKeepAgreedPrice(true); }
  }, [open]);
  const actualDate = parseLaPazDateTimeInput(actualReturnedAt);
  const lateCharge = !keepAgreedPrice && actualDate ? calculateLateReturnCharge({ scheduledDropoffAt: endDate, actualReturnedAt: actualDate, dailyRateCents: dailyRate }).chargeCents : 0;
  const submit = async () => {
    setSaving(true);
    try {
      const result = await markBookingReturnedAction(bookingId, locale, { force: true, actualReturnedAt, keepAgreedPrice, reason });
      if (!result.success) { toast.error(result.error); return; }
      toast.success(t("returnCompleted"));
      onOpenChange(false);
      onCompleted();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("returnFailed"));
    } finally { setSaving(false); }
  };
  return (
    <Dialog open={open} onOpenChange={(value) => { if (!saving) onOpenChange(value); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>{t("forceReturn")}</DialogTitle><DialogDescription>{t("forceReturnHelp")}</DialogDescription></DialogHeader>
        <label className="space-y-2 text-sm font-medium">{t("actualReturnTime")}<Input type="datetime-local" value={actualReturnedAt} max={formatDateTimeInputInLaPaz(new Date())} onChange={(event) => setActualReturnedAt(event.target.value)} disabled={saving} /></label>
        <label className="flex items-center gap-3 text-sm"><Checkbox checked={keepAgreedPrice} onCheckedChange={(value) => setKeepAgreedPrice(value === true)} disabled={saving} />{t("keepAgreedPrice")}</label>
        <p className="text-sm text-slate-600">{t("forceReturnPriceHelp")}</p>
        <label className="space-y-2 text-sm font-medium">{t("overrideReason")}<Textarea value={reason} onChange={(event) => setReason(event.target.value)} disabled={saving} /></label>
        <p className="rounded-xl bg-slate-50 p-3 text-sm">{t("returnTotal", { amount: formatCurrency(totalAmount + lateCharge) })}</p>
        <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>{t("cancel")}</Button><Button type="button" onClick={submit} disabled={saving || !reason.trim() || !actualDate}>{saving ? t("saving") : t("forceReturn")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { createDiscountCodeAction, updateDiscountCodeAction } from "@/actions/discounts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, TicketPercent, X } from "lucide-react";

export function DiscountCodeDialog({
  discount,
  locale,
  onClose,
}: {
  discount: any;
  locale: string;
  onClose: () => void;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(!!discount);
  const [code, setCode] = useState(discount?.code || "");
  const [description, setDescription] = useState(discount?.description || "");
  const [percentage, setPercentage] = useState(discount?.percentage || 10);
  const [maxUses, setMaxUses] = useState(discount?.maxUses || "");
  const [expiresAt, setExpiresAt] = useState(discount?.expiresAt ? new Date(discount.expiresAt).toISOString().slice(0, 10) : "");
  const [isActive, setIsActive] = useState(discount?.isActive ?? true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setIsOpen(!!discount);
  }, [discount]);

  const handleSave = async () => {
    setBusy(true);
    const payload = { code, description, percentage, maxUses, expiresAt, isActive };
    const result = discount?.id
      ? await updateDiscountCodeAction(discount.id, payload, locale)
      : await createDiscountCodeAction(payload, locale);
    setBusy(false);
    if (!result.success) {
      toast.error(result.error || t("admin.discounts.messages.saveFailed"));
      return;
    }
    toast.success(discount?.id ? t("admin.discounts.messages.updated") : t("admin.discounts.messages.created"));
    onClose();
    router.refresh();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TicketPercent className="h-5 w-5" />
            {discount?.id ? t("admin.discounts.edit") : t("admin.discounts.add")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={t("admin.discounts.code")} />
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("admin.discounts.description")} />
          <Input type="number" min={1} max={100} value={percentage} onChange={(e) => setPercentage(parseInt(e.target.value || "10", 10))} placeholder={t("admin.discounts.percentage")} />
          <Input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder={t("admin.discounts.maxUses")} />
          <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            {t("admin.discounts.active")}
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}><X className="h-4 w-4" />{t("common.cancel")}</Button>
            <Button onClick={handleSave} disabled={busy}><Save className="h-4 w-4" />{busy ? t("admin.settings.saving") : t("common.save")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

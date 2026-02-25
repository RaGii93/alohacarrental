"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createExtraAction, updateExtraAction } from "@/actions/extras";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PackagePlus, Save, X } from "lucide-react";

export function ExtraDialog({
  extra,
  locale,
  onClose,
}: {
  extra: any;
  locale: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(!!extra);
  const [name, setName] = useState(extra?.name || "");
  const [description, setDescription] = useState(extra?.description || "");
  const [pricingType, setPricingType] = useState<"DAILY" | "FLAT">(extra?.pricingType || "FLAT");
  const [amount, setAmount] = useState(extra?.amount ? extra.amount / 100 : 0);
  const [isActive, setIsActive] = useState(extra?.isActive ?? true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setIsOpen(!!extra);
    if (extra) {
      setName(extra.name || "");
      setDescription(extra.description || "");
      setPricingType(extra.pricingType || "FLAT");
      setAmount(extra.amount ? extra.amount / 100 : 0);
      setIsActive(extra.isActive ?? true);
    }
  }, [extra]);

  const handleSave = async () => {
    setBusy(true);
    const payload = { name, description, pricingType, amount, isActive };
    const result = extra?.id
      ? await updateExtraAction(extra.id, payload, locale)
      : await createExtraAction(payload, locale);
    setBusy(false);
    if (!result.success) {
      toast.error(result.error || "Failed to save extra");
      return;
    }
    toast.success(extra?.id ? "Extra updated" : "Extra created");
    onClose();
    router.refresh();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5" />
            {extra?.id ? "Edit Extra" : "Add Extra"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
          <select value={pricingType} onChange={(e) => setPricingType(e.target.value as any)} className="h-10 w-full rounded-md border px-3 text-sm">
            <option value="FLAT">Flat rate</option>
            <option value="DAILY">Daily rate</option>
          </select>
          <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value || "0"))} placeholder="Amount" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}><X className="h-4 w-4" />Cancel</Button>
            <Button onClick={handleSave} disabled={busy}><Save className="h-4 w-4" />{busy ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createVehicleFeatureAction, updateVehicleFeatureAction } from "@/actions/vehicle-features";

type VehicleFeature = {
  id?: string;
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export function VehicleFeatureDialog({
  feature,
  onClose,
}: {
  feature: VehicleFeature | null;
  onClose: () => void;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(Boolean(feature));
  const [name, setName] = useState(feature?.name || "");
  const [sortOrder, setSortOrder] = useState(feature?.sortOrder ?? 0);
  const [isActive, setIsActive] = useState(feature?.isActive ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsOpen(Boolean(feature));
    setName(feature?.name || "");
    setSortOrder(feature?.sortOrder ?? 0);
    setIsActive(feature?.isActive ?? true);
  }, [feature]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = { name, sortOrder, isActive };
      const result = feature?.id
        ? await updateVehicleFeatureAction(feature.id, payload)
        : await createVehicleFeatureAction(payload);

      if (!result.success) {
        toast.error(result.error || t("admin.features.messages.saveFailed"));
        return;
      }

      toast.success(feature?.id ? t("admin.features.messages.updated") : t("admin.features.messages.created"));
      setIsOpen(false);
      onClose();
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{feature?.id ? t("admin.features.edit") : t("admin.features.add")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder={t("admin.features.name")} />
          <Input
            type="number"
            min={0}
            value={sortOrder}
            onChange={(event) => setSortOrder(parseInt(event.target.value || "0", 10))}
            placeholder={t("admin.features.sortOrder")}
          />
          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox checked={isActive} onCheckedChange={(checked) => setIsActive(Boolean(checked))} />
            {t("admin.features.active")}
          </label>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            {isSubmitting ? t("admin.settings.saving") : t("common.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

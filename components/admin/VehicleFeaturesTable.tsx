"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { archiveVehicleFeatureAction } from "@/actions/vehicle-features";
import { VehicleFeatureDialog } from "./VehicleFeatureDialog";

type VehicleFeatureRow = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { categories?: number };
};

export function VehicleFeaturesTable({
  features,
}: {
  features: VehicleFeatureRow[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const [selected, setSelected] = useState<Partial<VehicleFeatureRow> | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      [...features].sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.name.localeCompare(b.name);
      }),
    [features]
  );

  const handleArchive = async (featureId: string) => {
    setBusyId(featureId);
    const result = await archiveVehicleFeatureAction(featureId);
    setBusyId(null);
    setPendingArchiveId(null);
    if (!result.success) {
      toast.error(result.error || t("admin.features.messages.archiveFailed"));
      return;
    }
    toast.success(t("admin.features.messages.archived"));
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <ConfirmActionDialog
        open={Boolean(pendingArchiveId)}
        onOpenChange={(open) => {
          if (!open && !busyId) setPendingArchiveId(null);
        }}
        title={t("admin.features.confirm.archiveTitle")}
        description={t("admin.features.confirm.archiveDescription")}
        confirmLabel={t("admin.features.actions.archive")}
        destructive
        loading={Boolean(busyId)}
        onConfirm={() => (pendingArchiveId ? handleArchive(pendingArchiveId) : undefined)}
      />
      <div className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f7faff)] p-4 shadow-[0_20px_46px_-34px_rgba(15,23,42,0.18)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">{t("admin.features.title")}</p>
          <p className="mt-1 text-sm text-slate-600">{t("admin.features.tableHint")}</p>
        </div>
        <Button onClick={() => setSelected({})}>+ {t("admin.features.add")}</Button>
      </div>
      <VehicleFeatureDialog feature={selected} onClose={() => setSelected(null)} />

      <div className="overflow-hidden rounded-[1.6rem] bg-white shadow-[0_24px_56px_-32px_hsl(215_28%_17%/0.12)] ring-1 ring-[hsl(215_25%_27%/0.05)]">
        <Table className="bg-transparent">
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.features.name")}</TableHead>
              <TableHead>{t("admin.features.slug")}</TableHead>
              <TableHead>{t("admin.features.sortOrder")}</TableHead>
              <TableHead>{t("admin.features.table.categories")}</TableHead>
              <TableHead>{t("admin.vehicles.table.status")}</TableHead>
              <TableHead>{t("admin.vehicles.table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((feature) => (
              <TableRow key={feature.id}>
                <TableCell className="font-medium">{feature.name}</TableCell>
                <TableCell>{feature.slug}</TableCell>
                <TableCell>{feature.sortOrder}</TableCell>
                <TableCell>{feature._count?.categories ?? 0}</TableCell>
                <TableCell>
                  <Badge className={feature.isActive ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-700"}>
                    {feature.isActive ? t("admin.features.status.active") : t("admin.features.status.archived")}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setSelected(feature)}>
                    {t("common.edit")}
                  </Button>
                  {feature.isActive ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busyId === feature.id}
                      onClick={() => setPendingArchiveId(feature.id)}
                    >
                      {t("admin.features.actions.archive")}
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

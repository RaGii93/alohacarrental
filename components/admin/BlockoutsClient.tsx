"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/datetime";
import { createVehicleBlockoutAction, deleteVehicleBlockoutAction } from "@/actions/blockouts";
import { CompactText } from "@/components/shared/CompactText";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";

export function BlockoutsClient({
  locale,
  vehicles,
  rows,
}: {
  locale: string;
  vehicles: Array<{ id: string; name: string }>;
  rows: Array<{
    id: string;
    vehicleId: string | null;
    vehicleName: string | null;
    startDate: Date;
    endDate: Date;
    note: string | null;
    createdAt: Date;
  }>;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const createBlockout = async (formData: FormData) => {
    setIsSaving(true);
    const result = await createVehicleBlockoutAction(formData, locale);
    setIsSaving(false);
    if (!result.success) {
      toast.error(result.error || t("admin.blockouts.messages.createFailed"));
      return;
    }
    toast.success(t("admin.blockouts.messages.created"));
    router.refresh();
  };

  const deleteBlockout = async (blockoutId: string) => {
    setIsDeletingId(blockoutId);
    const result = await deleteVehicleBlockoutAction(blockoutId, locale);
    setIsDeletingId(null);
    setPendingDeleteId(null);
    if (!result.success) {
      toast.error(result.error || t("admin.blockouts.messages.deleteFailed"));
      return;
    }
    toast.success(t("admin.blockouts.messages.deleted"));
    router.refresh();
  };

  return (
    <div className="space-y-8">
      <ConfirmActionDialog
        open={Boolean(pendingDeleteId)}
        onOpenChange={(open) => {
          if (!open && !isDeletingId) setPendingDeleteId(null);
        }}
        title={t("admin.blockouts.deleteConfirmTitle")}
        description={t("admin.blockouts.deleteConfirmDescription")}
        confirmLabel={t("common.delete")}
        destructive
        loading={Boolean(isDeletingId)}
        onConfirm={() => pendingDeleteId ? deleteBlockout(pendingDeleteId) : undefined}
      />
      <form action={createBlockout} className="grid gap-4 rounded-[1.6rem] bg-white p-5 shadow-[0_24px_56px_-32px_hsl(215_28%_17%/0.12)] ring-1 ring-[hsl(215_25%_27%/0.05)] md:grid-cols-2 xl:grid-cols-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.blockouts.form.vehicleScope")}</label>
          <select name="vehicleId" className="h-10 w-full rounded-md border px-3 text-sm">
            <option value="">{t("admin.blockouts.form.allVehicles")}</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.blockouts.form.start")}</label>
          <input name="startDate" type="datetime-local" className="h-10 w-full rounded-md border px-3 text-sm" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.blockouts.form.end")}</label>
          <input name="endDate" type="datetime-local" className="h-10 w-full rounded-md border px-3 text-sm" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("admin.blockouts.form.reason")}</label>
          <input name="note" type="text" className="h-10 w-full rounded-md border px-3 text-sm" placeholder={t("admin.blockouts.form.optionalNote")} />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={isSaving} className="w-full">
            {isSaving ? t("admin.blockouts.form.saving") : t("admin.blockouts.form.create")}
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-[1.6rem] bg-white shadow-[0_24px_56px_-32px_hsl(215_28%_17%/0.12)] ring-1 ring-[hsl(215_25%_27%/0.05)]">
        <Table className="bg-transparent">
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.blockouts.table.scope")}</TableHead>
              <TableHead>{t("admin.blockouts.table.start")}</TableHead>
              <TableHead>{t("admin.blockouts.table.end")}</TableHead>
              <TableHead>{t("admin.blockouts.table.reason")}</TableHead>
              <TableHead>{t("admin.blockouts.table.created")}</TableHead>
              <TableHead>{t("admin.blockouts.table.action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.vehicleName || t("admin.blockouts.form.allVehicles")}</TableCell>
                <TableCell>{formatDateTime(row.startDate)}</TableCell>
                <TableCell>{formatDateTime(row.endDate)}</TableCell>
                <TableCell>
                  <CompactText text={row.note} expandedTitle={t("admin.blockouts.table.fullReason")} />
                </TableCell>
                <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPendingDeleteId(row.id)}
                    disabled={isDeletingId === row.id}
                  >
                    {isDeletingId === row.id ? t("admin.blockouts.table.deleting") : t("common.delete")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

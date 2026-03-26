"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/datetime";
import { CompactText } from "@/components/shared/CompactText";
import {
  syncBookingZohoTransferAction,
  syncPendingZohoTransfersAction,
} from "@/actions/zoho-admin";

type TransferRow = {
  id: string;
  bookingCode: string;
  customerName: string;
  totalAmount: number;
  billingDocumentType: string | null;
  zohoTransferStatus: string | null;
  zohoDocumentType: string | null;
  zohoLastError: string | null;
  zohoSyncRequestedAt: Date | null;
  zohoSyncedAt: Date | null;
  paymentReceivedAt: Date | null;
};

function getStatusClass(status: string | null) {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-800";
    case "FAILED":
      return "bg-red-100 text-red-800";
    case "PENDING":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

export function ZohoTransfersClient({
  rows,
  locale,
}: {
  rows: TransferRow[];
  locale: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);

  const syncRow = async (bookingId: string) => {
    setActiveId(bookingId);
    const result = await syncBookingZohoTransferAction(bookingId, locale);
    setActiveId(null);
    if (!result.success) {
      toast.error(result.error || t("admin.zoho.messages.transferFailed"));
      return;
    }
    toast.success(t("admin.zoho.messages.transferCompleted"));
    router.refresh();
  };

  const syncPending = async () => {
    setIsBulkSyncing(true);
    const result = await syncPendingZohoTransfersAction(locale);
    setIsBulkSyncing(false);
    if (!result.success) {
      toast.error(result.error || t("admin.zoho.messages.runFailed"));
      return;
    }
    if (result.failures.length > 0) {
      toast.warning(t("admin.zoho.messages.runCompletedWithFailures", { completed: result.completed, failed: result.failures.length }));
    } else {
      toast.success(t("admin.zoho.messages.runCompleted", { completed: result.completed }));
    }
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t("admin.zoho.description")}
        </p>
        <div className="flex items-center gap-2">
          <Button onClick={syncPending} disabled={isBulkSyncing}>
            {isBulkSyncing ? t("admin.zoho.actions.syncing") : t("admin.zoho.actions.syncPending")}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.6rem] bg-white shadow-[0_24px_56px_-32px_hsl(215_28%_17%/0.12)] ring-1 ring-[hsl(215_25%_27%/0.05)]">
        <Table className="bg-transparent">
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.zoho.table.booking")}</TableHead>
              <TableHead>{t("admin.zoho.table.customer")}</TableHead>
              <TableHead>{t("admin.zoho.table.billing")}</TableHead>
              <TableHead>{t("admin.zoho.table.status")}</TableHead>
              <TableHead>{t("admin.zoho.table.requested")}</TableHead>
              <TableHead>{t("admin.zoho.table.synced")}</TableHead>
              <TableHead>{t("admin.zoho.table.amount")}</TableHead>
              <TableHead>{t("admin.zoho.table.action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="font-medium">{row.bookingCode}</div>
                  <a href={`/${locale}/admin/bookings/${row.id}`} className="text-xs text-blue-600 hover:underline">
                    {t("admin.zoho.table.openBooking")}
                  </a>
                </TableCell>
                <TableCell>{row.customerName}</TableCell>
                <TableCell>
                  <div className="font-medium">{row.billingDocumentType || t("admin.zoho.table.none")}</div>
                  <div className="text-xs text-muted-foreground">
                    {row.paymentReceivedAt ? t("admin.zoho.table.paymentReceived") : t("admin.zoho.table.awaitingPayment")}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusClass(row.zohoTransferStatus)}>
                    {row.zohoTransferStatus || t("admin.zoho.table.notQueued")}
                  </Badge>
                  {row.zohoDocumentType && (
                    <div className="mt-1 text-xs text-muted-foreground">{row.zohoDocumentType}</div>
                  )}
                  {row.zohoLastError && (
                    <div className="mt-1 text-xs text-red-700">
                      <CompactText
                        text={row.zohoLastError}
                        widthClassName="max-w-[18rem]"
                        className="text-xs leading-5 text-red-700"
                        expandedTitle={t("admin.zoho.table.fullSyncError")}
                      />
                    </div>
                  )}
                </TableCell>
                <TableCell>{row.zohoSyncRequestedAt ? formatDateTime(row.zohoSyncRequestedAt) : "-"}</TableCell>
                <TableCell>{row.zohoSyncedAt ? formatDateTime(row.zohoSyncedAt) : "-"}</TableCell>
                <TableCell>${(row.totalAmount / 100).toFixed(2)}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    onClick={() => syncRow(row.id)}
                    disabled={activeId === row.id || !row.billingDocumentType}
                  >
                    {activeId === row.id ? t("admin.zoho.actions.syncing") : row.zohoTransferStatus === "COMPLETED" ? t("admin.zoho.actions.resync") : t("admin.zoho.actions.sync")}
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

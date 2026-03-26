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
  refreshQuickBooksNameCacheAction,
  syncBookingQuickBooksTransferAction,
  syncPendingQuickBooksTransfersAction,
} from "@/actions/quickbooks-admin";

type TransferRow = {
  id: string;
  bookingCode: string;
  customerName: string;
  totalAmount: number;
  billingDocumentType: string | null;
  quickBooksTransferStatus: string | null;
  quickBooksDocumentType: string | null;
  quickBooksLastError: string | null;
  quickBooksSyncRequestedAt: Date | null;
  quickBooksSyncedAt: Date | null;
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

export function QuickBooksTransfersClient({
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
  const [isRefreshingCache, setIsRefreshingCache] = useState(false);

  const syncRow = async (bookingId: string) => {
    setActiveId(bookingId);
    const result = await syncBookingQuickBooksTransferAction(bookingId, locale);
    setActiveId(null);
    if (!result.success) {
      toast.error(result.error || t("admin.quickbooks.messages.transferFailed"));
      return;
    }
    toast.success(t("admin.quickbooks.messages.transferCompleted"));
    router.refresh();
  };

  const syncPending = async () => {
    setIsBulkSyncing(true);
    const result = await syncPendingQuickBooksTransfersAction(locale);
    setIsBulkSyncing(false);
    if (!result.success) {
      toast.error(result.error || t("admin.quickbooks.messages.runFailed"));
      return;
    }
    if (result.failures.length > 0) {
      toast.warning(t("admin.quickbooks.messages.runCompletedWithFailures", { completed: result.completed, failed: result.failures.length }));
    } else {
      toast.success(t("admin.quickbooks.messages.runCompleted", { completed: result.completed }));
    }
    router.refresh();
  };

  const refreshCache = async () => {
    setIsRefreshingCache(true);
    const result = await refreshQuickBooksNameCacheAction(locale);
    setIsRefreshingCache(false);
    if (!result.success) {
      toast.error(result.error || t("admin.quickbooks.messages.cacheRefreshFailed"));
      return;
    }
    toast.success(t("admin.quickbooks.messages.cacheRefreshed", { count: result.count }));
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t("admin.quickbooks.description")}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshCache} disabled={isRefreshingCache || isBulkSyncing}>
            {isRefreshingCache ? t("admin.quickbooks.actions.refreshing") : t("admin.quickbooks.actions.refreshCache")}
          </Button>
          <Button onClick={syncPending} disabled={isBulkSyncing || isRefreshingCache}>
            {isBulkSyncing ? t("admin.quickbooks.actions.syncing") : t("admin.quickbooks.actions.syncPending")}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.6rem] bg-white shadow-[0_24px_56px_-32px_hsl(215_28%_17%/0.12)] ring-1 ring-[hsl(215_25%_27%/0.05)]">
        <Table className="bg-transparent">
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.quickbooks.table.booking")}</TableHead>
              <TableHead>{t("admin.quickbooks.table.customer")}</TableHead>
              <TableHead>{t("admin.quickbooks.table.billing")}</TableHead>
              <TableHead>{t("admin.quickbooks.table.qbStatus")}</TableHead>
              <TableHead>{t("admin.quickbooks.table.requested")}</TableHead>
              <TableHead>{t("admin.quickbooks.table.synced")}</TableHead>
              <TableHead>{t("admin.quickbooks.table.amount")}</TableHead>
              <TableHead>{t("admin.quickbooks.table.action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div className="font-medium">{row.bookingCode}</div>
                  <a href={`/${locale}/admin/bookings/${row.id}`} className="text-xs text-blue-600 hover:underline">
                    {t("admin.quickbooks.table.openBooking")}
                  </a>
                </TableCell>
                <TableCell>{row.customerName}</TableCell>
                <TableCell>
                  <div className="font-medium">{row.billingDocumentType || t("admin.quickbooks.table.none")}</div>
                  <div className="text-xs text-muted-foreground">
                    {row.paymentReceivedAt ? t("admin.quickbooks.table.paymentReceived") : t("admin.quickbooks.table.awaitingPayment")}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusClass(row.quickBooksTransferStatus)}>
                    {row.quickBooksTransferStatus || t("admin.quickbooks.table.notQueued")}
                  </Badge>
                  {row.quickBooksDocumentType && (
                    <div className="mt-1 text-xs text-muted-foreground">{row.quickBooksDocumentType}</div>
                  )}
                  {row.quickBooksLastError && (
                    <div className="mt-1 text-xs text-red-700">
                      <CompactText
                        text={row.quickBooksLastError}
                        widthClassName="max-w-[18rem]"
                        className="text-xs leading-5 text-red-700"
                        expandedTitle={t("admin.quickbooks.table.fullSyncError")}
                      />
                    </div>
                  )}
                </TableCell>
                <TableCell>{row.quickBooksSyncRequestedAt ? formatDateTime(row.quickBooksSyncRequestedAt) : "-"}</TableCell>
                <TableCell>{row.quickBooksSyncedAt ? formatDateTime(row.quickBooksSyncedAt) : "-"}</TableCell>
                <TableCell>${(row.totalAmount / 100).toFixed(2)}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    onClick={() => syncRow(row.id)}
                    disabled={activeId === row.id || !row.billingDocumentType}
                  >
                    {activeId === row.id ? t("admin.quickbooks.actions.syncing") : row.quickBooksTransferStatus === "COMPLETED" ? t("admin.quickbooks.actions.resync") : t("admin.quickbooks.actions.sync")}
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

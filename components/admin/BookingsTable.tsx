"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatDateTimeRange } from "@/lib/datetime";
import { markBookingDeliveredAction, markBookingReturnedAction } from "@/actions/booking";

interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicle?: {
    id: string;
    name?: string | null;
  } | null;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  status: string;
  createdAt: Date;
  paymentReceivedAt?: Date | null;
  deliveredAt?: Date | null;
  returnedAt?: Date | null;
}

export function BookingsTable({
  bookings,
  locale,
  status,
  dateMode = "range",
  actionMode = "none",
}: {
  bookings: Booking[];
  locale: string;
  status:  string;
  dateMode?: "range" | "pickup" | "dropoff";
  actionMode?: "none" | "deliveries" | "returns";
}) {
  const t = useTranslations();
  const router = useRouter();
  const [sortKey, setSortKey] = useState<"customerName" | "vehicle" | "startDate" | "totalAmount" | "status">("startDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  };

  const sortIndicator = (key: typeof sortKey) => (sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "");

  const sorted = useMemo(() => {
    const rows = [...bookings];
    rows.sort((a, b) => {
      const vehicleA = (a.vehicle?.name || "").toLowerCase();
      const vehicleB = (b.vehicle?.name || "").toLowerCase();
      const valA =
        sortKey === "customerName"
          ? a.customerName.toLowerCase()
          : sortKey === "vehicle"
            ? vehicleA
            : sortKey === "startDate"
              ? (dateMode === "dropoff" ? new Date(a.endDate).getTime() : new Date(a.startDate).getTime())
              : sortKey === "totalAmount"
                ? a.totalAmount
                : a.status.toLowerCase();
      const valB =
        sortKey === "customerName"
          ? b.customerName.toLowerCase()
          : sortKey === "vehicle"
            ? vehicleB
            : sortKey === "startDate"
              ? (dateMode === "dropoff" ? new Date(b.endDate).getTime() : new Date(b.startDate).getTime())
              : sortKey === "totalAmount"
                ? b.totalAmount
                : b.status.toLowerCase();
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [bookings, sortKey, sortDir]);

  const pageRows = sorted;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "DECLINED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const markDelivered = async (bookingId: string) => {
    if (!window.confirm("Mark this booking as delivered now?")) return;
    const result = await markBookingDeliveredAction(bookingId, locale);
    if (!result.success) {
      toast.error(result.error || "Failed to mark as delivered");
      return;
    }
    toast.success("Booking marked as delivered.");
    router.refresh();
  };

  const markReturned = async (bookingId: string) => {
    if (!window.confirm("Mark this booking as returned now?")) return;
    const result = await markBookingReturnedAction(bookingId, locale);
    if (!result.success) {
      toast.error(result.error || "Failed to mark as returned");
      return;
    }
    toast.success("Booking marked as returned.");
    router.refresh();
  };

  return (
    <div className="mt-6 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <button type="button" onClick={() => toggleSort("customerName")}>{t("admin.bookings.table.customer")}{sortIndicator("customerName")}</button>
            </TableHead>
            <TableHead>
              <button type="button" onClick={() => toggleSort("vehicle")}>{t("admin.bookings.table.vehicle")}{sortIndicator("vehicle")}</button>
            </TableHead>
            <TableHead>
              <button type="button" onClick={() => toggleSort("startDate")}>{t("admin.bookings.table.dates")}{sortIndicator("startDate")}</button>
            </TableHead>
            <TableHead>
              <button type="button" onClick={() => toggleSort("totalAmount")}>{t("admin.bookings.table.total")}{sortIndicator("totalAmount")}</button>
            </TableHead>
            <TableHead>
              <button type="button" onClick={() => toggleSort("status")}>{t("admin.bookings.table.status")}{sortIndicator("status")}</button>
            </TableHead>
            <TableHead>{t("admin.bookings.table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell>
                <div className="font-medium">{booking.customerName}</div>
                <div className="text-sm text-gray-500">{booking.customerEmail}</div>
              </TableCell>
              <TableCell>{booking.vehicle?.name ?? "—"}</TableCell>
              <TableCell>
                <div className="text-sm">
                  {dateMode === "pickup"
                    ? formatDateTime(booking.startDate)
                    : dateMode === "dropoff"
                      ? formatDateTime(booking.endDate)
                      : formatDateTimeRange(booking.startDate, booking.endDate)}
                </div>
              </TableCell>
              <TableCell className="font-medium">
                ${(booking.totalAmount / 100).toFixed(2)}
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/${locale}/admin/bookings/${booking.id}`}>
                    <Button size="sm" variant="outline">
                      {t("admin.bookings.actions.view")}
                    </Button>
                  </Link>
                  {actionMode === "deliveries" && (
                    booking.deliveredAt ? (
                      <span className="text-xs text-muted-foreground">Delivered</span>
                    ) : booking.paymentReceivedAt ? (
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => markDelivered(booking.id)}
                      >
                        Mark Delivered
                      </Button>
                    ) : (
                      <span className="text-xs text-amber-700">Awaiting payment</span>
                    )
                  )}
                  {actionMode === "returns" && (
                    booking.returnedAt ? (
                      <span className="text-xs text-muted-foreground">Returned</span>
                    ) : booking.deliveredAt ? (
                      <Button
                        size="sm"
                        className="bg-slate-700 hover:bg-slate-800"
                        onClick={() => markReturned(booking.id)}
                      >
                        Mark Returned
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not delivered</span>
                    )
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {bookings.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {t("admin.bookings.empty")}
        </div>
      )}
    </div>
  );
}

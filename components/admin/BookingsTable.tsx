"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, Truck, Undo2 } from "lucide-react";
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

interface Booking {
  id: string;
  bookingCode: string;
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
  const getStatusLabel = (bookingStatus: string) => {
    switch (bookingStatus) {
      case "PENDING":
        return t("common.pending");
      case "CONFIRMED":
        return t("common.confirmed");
      case "DECLINED":
        return t("common.declined");
      case "CANCELLED":
        return t("common.cancelled");
      default:
        return bookingStatus;
    }
  };

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

  return (
    <div className="admin-surface overflow-hidden rounded-[1.6rem] border-transparent">
      <Table className="bg-transparent">
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
                <div className="text-sm text-gray-500">{booking.bookingCode} · {booking.customerEmail}</div>
              </TableCell>
              <TableCell>{booking.vehicle?.name ?? t("admin.bookings.table.noVehicle")}</TableCell>
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
                  {getStatusLabel(booking.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/${locale}/admin/bookings/${booking.id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                      {t("admin.bookings.actions.view")}
                    </Button>
                  </Link>
                  {actionMode === "deliveries" && (
                    booking.deliveredAt ? (
                      <span className="text-xs text-muted-foreground">{t("admin.bookings.actions.delivered")}</span>
                    ) : booking.paymentReceivedAt ? (
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => router.push(`/${locale}/admin/bookings/${booking.id}`)}>
                        <Truck className="h-4 w-4" />
                        {t("admin.bookings.detail.inspection.title.pickup")}
                      </Button>
                    ) : (
                      <span className="text-xs text-amber-700">{t("admin.bookings.actions.awaitingPayment")}</span>
                    )
                  )}
                  {actionMode === "returns" && (
                    booking.returnedAt ? (
                      <span className="text-xs text-muted-foreground">{t("admin.bookings.actions.returned")}</span>
                    ) : booking.deliveredAt ? (
                      <Button size="sm" className="bg-slate-700 hover:bg-slate-800" onClick={() => router.push(`/${locale}/admin/bookings/${booking.id}`)}>
                        <Undo2 className="h-4 w-4" />
                        {t("admin.bookings.detail.inspection.title.return")}
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">{t("admin.bookings.actions.notDelivered")}</span>
                    )
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {bookings.length === 0 && (
        <div className="border-t border-[hsl(214_32%_92%)] bg-white px-6 py-12 text-center text-sm font-medium text-[hsl(var(--muted-foreground))]">
          {t("admin.bookings.empty")}
        </div>
      )}
    </div>
  );
}

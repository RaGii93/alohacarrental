"use client";

import Link from "next/link";
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
}

export function BookingsTable({
  bookings,
  locale,
  status,
}: {
  bookings: Booking[];
  locale: string;
  status:  string;
}) {
  const t = useTranslations();
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
    <div className="mt-6 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("admin.bookings.table.customer")}</TableHead>
            <TableHead>{t("admin.bookings.table.vehicle")}</TableHead>
            <TableHead>{t("admin.bookings.table.dates")}</TableHead>
            <TableHead>{t("admin.bookings.table.total")}</TableHead>
            <TableHead>{t("admin.bookings.table.status")}</TableHead>
            <TableHead>{t("admin.bookings.table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell>
                <div className="font-medium">{booking.customerName}</div>
                <div className="text-sm text-gray-500">{booking.customerEmail}</div>
              </TableCell>
              <TableCell>{booking.vehicle?.name ?? "—"}</TableCell>
              <TableCell>
                <div className="text-sm">
                  {new Date(booking.startDate).toLocaleString()} -{" "}
                  {new Date(booking.endDate).toLocaleString()}
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
                <Link href={`/${locale}/admin/bookings/${booking.id}`}>
                  <Button size="sm" variant="outline">
                    {t("admin.bookings.actions.view")}
                  </Button>
                </Link>
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

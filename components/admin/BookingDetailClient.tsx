"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { DocumentPreview } from "@/components/shared/DocumentPreview";
import {
  confirmBookingAction,
  declineBookingAction,
} from "@/actions/booking";

export function BookingDetailClient({
  booking,
  locale,
}: {
  booking: any;
  locale: string;
}) {
  const router = useRouter();
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    const result = await confirmBookingAction(booking.id, locale);
    setIsLoading(false);

    if (result.success) {
      toast.success("Booking confirmed successfully");
      router.push(`/${locale}/admin`);
    } else {
      toast.error(result.error || "Error confirming booking");
    }
  };

  const handleDecline = async () => {
    const reason = prompt("Enter decline reason:");
    if (!reason) return;

    setIsLoading(true);
    const result = await declineBookingAction(booking.id, reason, locale);
    setIsLoading(false);

    if (result.success) {
      toast.success("Booking declined successfully");
      router.push(`/${locale}/admin`);
    } else {
      toast.error(result.error || "Error declining booking");
    }
  };

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

  const pickupMapUrl = booking?.pickupLocationRef?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.pickupLocationRef.address)}`
    : null;
  const dropoffMapUrl = booking?.dropoffLocationRef?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.dropoffLocationRef.address)}`
    : null;

  return (
    <Card className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Booking #{booking.id.slice(0, 8)}
        </h1>
        <Badge className={getStatusColor(booking.status)}>
          {booking.status}
        </Badge>
      </div>

      <Separator className="my-6" />

      {booking.status === "PENDING" && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This booking is pending confirmation. It will automatically cancel in 2 hours if not confirmed.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="font-semibold mb-4">Customer Information</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-600">Name</dt>
              <dd className="font-medium">{booking.customerName}</dd>
            </div>
            <div>
              <dt className="text-gray-600">Email</dt>
              <dd className="font-medium">{booking.customerEmail}</dd>
            </div>
            <div>
              <dt className="text-gray-600">Phone</dt>
              <dd className="font-medium">{booking.customerPhone}</dd>
            </div>
            <div>
              <dt className="text-gray-600">Birth Date</dt>
              <dd className="font-medium">{booking.birthDate ? new Date(booking.birthDate).toLocaleDateString() : "-"}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="font-semibold mb-4">Booking Information</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-600">Vehicle</dt>
              <dd className="font-medium">{booking.vehicle?.name ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-600">Pickup Date & Time</dt>
              <dd className="font-medium">
                {new Date(booking.startDate).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600">Dropoff Date & Time</dt>
              <dd className="font-medium">
                {new Date(booking.endDate).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600">Pickup Location</dt>
              <dd className="font-medium">
                {booking.pickupLocationRef?.name || booking.pickupLocation || "-"}
                {pickupMapUrl && (
                  <>
                    {" "}
                    <a href={pickupMapUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      (map)
                    </a>
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600">Dropoff Location</dt>
              <dd className="font-medium">
                {booking.dropoffLocationRef?.name || booking.dropoffLocation || "-"}
                {dropoffMapUrl && (
                  <>
                    {" "}
                    <a href={dropoffMapUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      (map)
                    </a>
                  </>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600">License Expiry Date</dt>
              <dd className="font-medium">{booking.licenseExpiryDate ? new Date(booking.licenseExpiryDate).toLocaleDateString() : "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-600">Total Amount</dt>
              <dd className="font-medium">
                ${(booking.totalAmount / 100).toFixed(2)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <Separator className="my-6" />

      <div className="mb-8">
        <h2 className="font-semibold mb-4">{t("admin.bookings.detail.files")}</h2>
        <div className="space-y-2">
          <DocumentPreview
            url={booking.driverLicenseUrl}
            title={t("booking.driverLicense")}
            openLabel={t("booking.openOriginal")}
            emptyLabel={t("booking.documentUnavailable")}
          />
          {booking.paymentProofUrl && (
            <div>
              <a
                href={booking.paymentProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                📄 Payment Proof
              </a>
            </div>
          )}
        </div>
      </div>

      {booking.notes && (
        <>
          <Separator className="my-6" />
          <div className="mb-8">
            <h2 className="font-semibold mb-2">Notes</h2>
            <p className="text-gray-700">{booking.notes}</p>
          </div>
        </>
      )}

      <Separator className="my-6" />

      {booking.status === "PENDING" && (
        <div className="flex gap-4">
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? "Processing..." : "Confirm Booking"}
          </Button>
          <Button
            onClick={handleDecline}
            disabled={isLoading}
            variant="destructive"
          >
            {isLoading ? "Processing..." : "Decline Booking"}
          </Button>
        </div>
      )}
    </Card>
  );
}

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
import { SendBillingEmailButton } from "@/components/admin/SendBillingEmailButton";
import { getBlobProxyUrl } from "@/lib/blob";
import { formatDate, formatDateTime } from "@/lib/datetime";
import {
  confirmBookingAction,
  declineBookingAction,
  sendInvoiceEstimateAction,
  createSalesReceiptAction,
  applyDiscountCodeToBookingAction,
  addExtraToBookingAction,
} from "@/actions/booking";

export function BookingDetailClient({
  booking,
  locale,
  extras,
  discountCodes,
  taxPercentage,
}: {
  booking: any;
  locale: string;
  extras: Array<{ id: string; name: string; pricingType: "DAILY" | "FLAT"; amount: number }>;
  discountCodes: Array<{ id: string; code: string; percentage: number }>;
  taxPercentage: number;
}) {
  const router = useRouter();
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [extraId, setExtraId] = useState("");
  const [extraQty, setExtraQty] = useState(1);
  const invoiceDownloadUrl = getBlobProxyUrl(booking.invoiceUrl, { download: true });
  const rentalDays = Math.max(
    1,
    Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24))
  );
  const baseAmount = (booking.category?.dailyRate || 0) * rentalDays;
  const extrasAmount = (booking.bookingExtras || []).reduce((sum: number, line: any) => sum + (line?.lineTotal || 0), 0);
  const discountAmount = booking.bookingDiscount?.amount || 0;
  const subtotalBeforeTax = Math.max(0, baseAmount - discountAmount + extrasAmount);
  const taxAmount = Math.max(0, booking.totalAmount - subtotalBeforeTax);

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

  const handleSendInvoiceEstimate = async () => {
    setIsLoading(true);
    const result = await sendInvoiceEstimateAction(booking.id, locale);
    setIsLoading(false);
    if (result.success) {
      toast.success("Invoice sent to client for payment.");
      router.refresh();
    } else {
      toast.error(result.error || "Error sending invoice");
    }
  };

  const handleCreateSalesReceipt = async () => {
    setIsLoading(true);
    const result = await createSalesReceiptAction(booking.id, locale);
    setIsLoading(false);
    if (result.success) {
      toast.success("Sales receipt created. Payment marked as received and vehicle set ON_RENT.");
      router.refresh();
    } else {
      toast.error(result.error || "Error creating sales receipt");
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setIsLoading(true);
    const result = await applyDiscountCodeToBookingAction(booking.id, discountCode, locale);
    setIsLoading(false);
    if (result.success) {
      toast.success("Discount applied and invoice resent.");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to apply discount");
    }
  };

  const handleAddExtra = async () => {
    if (!extraId) return;
    setIsLoading(true);
    const result = await addExtraToBookingAction(booking.id, extraId, extraQty, locale);
    setIsLoading(false);
    if (result.success) {
      toast.success("Extra added and invoice resent.");
      setExtraId("");
      setExtraQty(1);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to add extra");
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
              <dd className="font-medium">{booking.birthDate ? formatDate(booking.birthDate) : "-"}</dd>
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
                {formatDateTime(booking.startDate)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600">Dropoff Date & Time</dt>
              <dd className="font-medium">
                {formatDateTime(booking.endDate)}
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
              <dd className="font-medium">{booking.licenseExpiryDate ? formatDate(booking.licenseExpiryDate) : "-"}</dd>
            </div>
            <div>
              <dt className="text-gray-600">Subtotal</dt>
              <dd className="font-medium">
                ${(subtotalBeforeTax / 100).toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600">Tax ({taxPercentage}%)</dt>
              <dd className="font-medium">
                ${(taxAmount / 100).toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600">Total Amount (Incl. Tax)</dt>
              <dd className="font-medium">
                ${(booking.totalAmount / 100).toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600">Payment Received</dt>
              <dd className="font-medium">{booking.paymentReceivedAt ? formatDateTime(booking.paymentReceivedAt) : "No"}</dd>
            </div>
          </dl>
        </div>
      </div>

      <Separator className="my-6" />

      <div className="mb-8 space-y-4">
        <h2 className="font-semibold">Pricing Adjustments</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border p-4 space-y-3">
            <p className="text-sm font-medium">Apply discount code (rental-only %)</p>
            <div className="flex gap-2">
              <input
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                list="discount-codes"
                placeholder="Enter code"
                className="h-9 w-full rounded-md border px-3 text-sm"
              />
              <datalist id="discount-codes">
                {discountCodes.map((d) => (
                  <option key={d.id} value={d.code}>
                    {d.code} ({d.percentage}%)
                  </option>
                ))}
              </datalist>
              <Button onClick={handleApplyDiscount} disabled={isLoading}>Apply</Button>
            </div>
            {booking.bookingDiscount && (
              <p className="text-xs text-muted-foreground">
                Applied: {booking.bookingDiscount.discountCode?.code} ({booking.bookingDiscount.percentage}%)
              </p>
            )}
          </div>

          <div className="rounded-md border p-4 space-y-3">
            <p className="text-sm font-medium">Add extras (daily or flat)</p>
            <div className="flex gap-2">
              <select
                value={extraId}
                onChange={(e) => setExtraId(e.target.value)}
                className="h-9 w-full rounded-md border px-3 text-sm"
              >
                <option value="">Select extra</option>
                {extras.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.pricingType}, ${(ex.amount / 100).toFixed(2)})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={extraQty}
                onChange={(e) => setExtraQty(Math.max(1, parseInt(e.target.value || "1", 10)))}
                className="h-9 w-20 rounded-md border px-2 text-sm"
              />
              <Button onClick={handleAddExtra} disabled={isLoading}>Add</Button>
            </div>
            {!!booking.bookingExtras?.length && (
              <div className="text-xs text-muted-foreground space-y-1">
                {booking.bookingExtras.map((line: any) => (
                  <p key={line.id}>
                    {line.extra?.name} x{line.quantity}: ${(line.lineTotal / 100).toFixed(2)}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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
          {booking.invoiceUrl && (
            <div className="flex items-center gap-3">
              <a
                href={invoiceDownloadUrl || booking.invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                📄 Billing Document
              </a>
              <SendBillingEmailButton
                bookingId={booking.id}
                locale={locale}
                label="Send by Email"
                className="h-auto p-0 text-blue-600 hover:text-blue-700 hover:underline"
              />
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

      {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
        <div className="flex gap-4 flex-wrap">
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? "Processing..." : "Confirm Booking"}
          </Button>
          <Button
            onClick={handleSendInvoiceEstimate}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : booking.invoiceUrl ? "Resend Invoice (Payment Request)" : "Send Invoice (Payment Request)"}
          </Button>
          <Button
            onClick={handleCreateSalesReceipt}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "Processing..." : "Create Sales Receipt (Payment Received)"}
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

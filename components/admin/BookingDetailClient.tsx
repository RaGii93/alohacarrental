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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { AlertCircle, Banknote, CalendarClock, CarFront, CheckCircle2, ClipboardCheck, ClipboardX, Copy, FileText, Mail, MapPin, PackagePlus, Receipt, Truck, Undo2, UserRound, Wallet } from "lucide-react";
import { DocumentPreview } from "@/components/shared/DocumentPreview";
import { BookingInspectionDialog } from "@/components/admin/BookingInspectionDialog";
import { SendBillingEmailButton } from "@/components/admin/SendBillingEmailButton";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { TextPromptDialog } from "@/components/shared/TextPromptDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getBlobProxyUrl } from "@/lib/blob";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { calculateBookingAmounts, calculateLateReturnCharge, getFuelChargePerQuarterForCategory, getFuelLevelLabel } from "@/lib/pricing";
import {
  confirmBookingAction,
  declineBookingAction,
  sendInvoiceEstimateAction,
  createSalesReceiptAction,
  receiveInvoicePaymentAction,
  applyDiscountCodeToBookingAction,
  addExtraToBookingAction,
} from "@/actions/booking";

export function BookingDetailClient({
  booking,
  locale,
  extras,
  discountCodes,
  taxPercentage,
  vehicleRatesIncludeTax,
  accountingProvider,
  role,
}: {
  booking: any;
  locale: string;
  extras: Array<{ id: string; name: string; pricingType: "DAILY" | "FLAT"; amount: number }>;
  discountCodes: Array<{ id: string; code: string; percentage: number }>;
  taxPercentage: number;
  vehicleRatesIncludeTax: boolean;
  accountingProvider: "NONE" | "QUICKBOOKS" | "ZOHO";
  role: string;
}) {
  const router = useRouter();
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [extraId, setExtraId] = useState("");
  const [extraQty, setExtraQty] = useState(1);
  const [confirmAction, setConfirmAction] = useState<null | "payment">(null);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [showSalesReceiptDialog, setShowSalesReceiptDialog] = useState(false);
  const [deliverNowForReceipt, setDeliverNowForReceipt] = useState(false);
  const [showPickupInspection, setShowPickupInspection] = useState(false);
  const [showReturnInspection, setShowReturnInspection] = useState(false);

  const invoiceDownloadUrl = getBlobProxyUrl(booking.invoiceUrl, { download: true });
  const rentalDays = Math.max(
    1,
    Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24))
  );
  const baseAmount = (booking.category?.dailyRate || 0) * rentalDays;
  const extrasAmount = (booking.bookingExtras || []).reduce((sum: number, line: any) => sum + (line?.lineTotal || 0), 0);
  const discountAmount = booking.bookingDiscount?.amount || 0;
  const { subtotalBeforeTax, taxAmount } = calculateBookingAmounts({
    baseRentalCents: baseAmount,
    extrasCents: extrasAmount,
    discountCents: discountAmount,
    taxPercentage,
    baseRentalIncludesTax: vehicleRatesIncludeTax,
  });
  const liveLateReturnPreview = calculateLateReturnCharge({
    scheduledDropoffAt: booking.endDate,
    actualReturnedAt: new Date(),
    dailyRateCents: booking.category?.dailyRate || 0,
  });
  const closeoutLateCharge = booking.returnLateCharge || 0;
  const closeoutFuelCharge = booking.returnFuelCharge || 0;
  const closeoutDamageCharge = booking.returnDamageCharge || 0;
  const closeoutCharges = closeoutLateCharge + closeoutFuelCharge + closeoutDamageCharge;
  const computedTotalAmount = subtotalBeforeTax + taxAmount + closeoutCharges;
  const categoryFuelChargePerQuarter = getFuelChargePerQuarterForCategory(booking.category);
  const pickupPhotos = (booking.inspectionPhotos || []).filter((photo: any) => photo.stage === "PICKUP");
  const returnPhotos = (booking.inspectionPhotos || []).filter((photo: any) => photo.stage === "RETURN");
  const statusLabel =
    booking.status === "PENDING"
      ? t("common.pending")
      : booking.status === "CONFIRMED"
        ? t("common.confirmed")
        : booking.status === "DECLINED"
          ? t("common.declined")
          : booking.status === "CANCELLED"
            ? t("common.cancelled")
            : booking.status;
  const rentalDaysLabel = t("admin.bookings.detail.summaryCards.rentalDays", { count: rentalDays });
  const lifecycleLabel = booking.returnedAt
    ? t("admin.bookings.actions.returned")
    : booking.deliveredAt
      ? t("admin.bookings.actions.delivered")
      : booking.paymentReceivedAt
        ? t("admin.bookings.detail.summaryCards.lifecyclePaid")
        : t("admin.bookings.detail.summaryCards.lifecycleOpen");
  const lifecycleDateLabel = booking.returnedAt
    ? formatDateTime(booking.returnedAt)
    : booking.deliveredAt
      ? formatDateTime(booking.deliveredAt)
      : booking.paymentReceivedAt
        ? formatDateTime(booking.paymentReceivedAt)
        : t("admin.bookings.detail.summaryCards.awaitingNextAction");

  const canEdit = (role === "ROOT" || role === "OWNER") && !booking.returnedAt;
  const canConfirm = booking.status === "PENDING";
  const canDecline = booking.status === "PENDING" || booking.status === "CONFIRMED";
  const canSendInvoice = booking.status === "PENDING" || booking.status === "CONFIRMED";
  const canCreateSalesReceipt = booking.status === "PENDING" || booking.status === "CONFIRMED";
  const canReceivePayment = !!booking.invoiceUrl && !booking.paymentReceivedAt;
  const canMarkDelivered = !!booking.paymentReceivedAt && !booking.deliveredAt;
  const canMarkReturned = !!booking.deliveredAt && !booking.returnedAt;
  const hasOpenBillingDoc = !!booking.invoiceUrl;

  const pickupMapUrl = booking?.pickupLocationRef?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.pickupLocationRef.address)}`
    : null;
  const dropoffMapUrl = booking?.dropoffLocationRef?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.dropoffLocationRef.address)}`
    : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "border-amber-200 bg-amber-50 text-amber-800";
      case "CONFIRMED":
        return "border-emerald-200 bg-emerald-50 text-emerald-800";
      case "DECLINED":
        return "border-rose-200 bg-rose-50 text-rose-800";
      case "CANCELLED":
        return "border-slate-200 bg-slate-100 text-slate-700";
      default:
        return "border-slate-200 bg-slate-100 text-slate-700";
    }
  };

  const withLoading = async (fn: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await fn();
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    await withLoading(async () => {
      const result = await confirmBookingAction(booking.id, locale);
      if (result.success) {
        toast.success(t("admin.bookings.detail.messages.confirmSuccess"));
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.bookings.detail.messages.confirmError"));
    });
  };

  const submitDecline = async (reason: string) => {
    await withLoading(async () => {
      const result = await declineBookingAction(booking.id, reason, locale);
      setShowDeclineDialog(false);
      if (result.success) {
        toast.success(t("admin.bookings.detail.messages.declineSuccess"));
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.bookings.detail.messages.declineError"));
    });
  };

  const handleSendInvoiceEstimate = async () => {
    await withLoading(async () => {
      const result = await sendInvoiceEstimateAction(booking.id, locale);
      if (result.success) {
        toast.success(
          booking.invoiceUrl
            ? t("admin.bookings.detail.messages.invoiceResent")
            : t("admin.bookings.detail.messages.invoiceSent")
        );
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.bookings.detail.messages.invoiceError"));
    });
  };

  const submitCreateSalesReceipt = async () => {
    await withLoading(async () => {
      const result = await createSalesReceiptAction(booking.id, locale, deliverNowForReceipt);
      setShowSalesReceiptDialog(false);
      if (result.success) {
        toast.success(
          deliverNowForReceipt
            ? t("admin.bookings.detail.messages.salesReceiptDelivered")
            : t("admin.bookings.detail.messages.salesReceiptCreated")
        );
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.bookings.detail.messages.salesReceiptError"));
    });
  };

  const submitReceivePaymentWithoutReceipt = async () => {
    await withLoading(async () => {
      const result = await receiveInvoicePaymentAction(booking.id, locale);
      setConfirmAction(null);
      if (result.success) {
        toast.success(t("admin.bookings.detail.messages.paymentReceived"));
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.bookings.detail.messages.paymentReceivedError"));
    });
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    await withLoading(async () => {
      const result = await applyDiscountCodeToBookingAction(booking.id, discountCode, locale);
      if (result.success) {
        toast.success(t("admin.bookings.detail.messages.discountApplied"));
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.bookings.detail.messages.discountError"));
    });
  };

  const handleAddExtra = async () => {
    if (!extraId) return;
    await withLoading(async () => {
      const result = await addExtraToBookingAction(booking.id, extraId, extraQty, locale);
      if (result.success) {
        toast.success(t("admin.bookings.detail.messages.extraAdded"));
        setExtraId("");
        setExtraQty(1);
        router.refresh();
        return;
      }
      toast.error(result.error || t("admin.bookings.detail.messages.extraError"));
    });
  };

  const copyBookingCode = async () => {
    try {
      await navigator.clipboard.writeText(booking.bookingCode);
      toast.success(t("admin.bookings.detail.messages.codeCopied"));
    } catch {
      toast.error(t("admin.bookings.detail.messages.codeCopyFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <TextPromptDialog
        open={showDeclineDialog}
        onOpenChange={setShowDeclineDialog}
        title={t("admin.bookings.detail.declineDialog.title")}
        description={t("admin.bookings.detail.declineDialog.description")}
        label={t("admin.bookings.detail.declineDialog.label")}
        placeholder={t("admin.bookings.detail.declineDialog.placeholder")}
        confirmLabel={t("admin.bookings.detail.declineDialog.confirm")}
        loading={isLoading}
        onConfirm={submitDecline}
      />

      <BookingInspectionDialog
        open={showPickupInspection}
        onOpenChange={setShowPickupInspection}
        mode="pickup"
        bookingId={booking.id}
        locale={locale}
        categoryName={booking.category?.name}
        dailyRate={booking.category?.dailyRate}
        scheduledDropoffAt={booking.endDate}
        fuelChargePerQuarter={booking.category?.fuelChargePerQuarter}
        pickupFuelLevel={booking.pickupFuelLevel}
        onCompleted={() => router.refresh()}
      />

      <BookingInspectionDialog
        open={showReturnInspection}
        onOpenChange={setShowReturnInspection}
        mode="return"
        bookingId={booking.id}
        locale={locale}
        categoryName={booking.category?.name}
        dailyRate={booking.category?.dailyRate}
        scheduledDropoffAt={booking.endDate}
        fuelChargePerQuarter={booking.category?.fuelChargePerQuarter}
        pickupFuelLevel={booking.pickupFuelLevel}
        onCompleted={() => router.refresh()}
      />

      <ConfirmActionDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open && !isLoading) setConfirmAction(null);
        }}
        title={t("admin.bookings.detail.confirm.paymentTitle")}
        description={t("admin.bookings.detail.confirm.paymentDescription")}
        confirmLabel={t("admin.bookings.detail.actions.receivePayment")}
        loading={isLoading}
        onConfirm={() => submitReceivePaymentWithoutReceipt()}
      />

      <Dialog open={showSalesReceiptDialog} onOpenChange={setShowSalesReceiptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.bookings.detail.salesReceipt.title")}</DialogTitle>
            <DialogDescription>
              {t("admin.bookings.detail.salesReceipt.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.35)] p-4">
            <Checkbox
              checked={deliverNowForReceipt}
              onCheckedChange={(value) => setDeliverNowForReceipt(Boolean(value))}
              id="deliver-now"
            />
            <label htmlFor="deliver-now" className="text-sm text-[hsl(var(--foreground)/0.82)]">
              {t("admin.bookings.detail.salesReceipt.deliverNow")}
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSalesReceiptDialog(false)} disabled={isLoading}>
              {t("common.cancel")}
            </Button>
            <Button onClick={submitCreateSalesReceipt} disabled={isLoading}>
              {isLoading ? t("admin.bookings.detail.actions.processing") : t("admin.bookings.detail.actions.createSalesReceipt")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="overflow-hidden rounded-[1.75rem] border-[hsl(var(--border))] bg-[linear-gradient(135deg,#ffffff,#f5f8ff)] shadow-[0_28px_70px_-40px_rgba(15,23,42,0.25)]">
        <div className="border-b border-[hsl(var(--border))] bg-[linear-gradient(135deg,rgba(15,87,178,0.08),rgba(255,255,255,0.95))] p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(booking.status)}`}>
                  {statusLabel}
                </Badge>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                  {booking.category?.name || t("admin.bookings.detail.trip.fields.category")} · {rentalDaysLabel}
                </span>
                {booking.paymentReceivedAt ? (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                    {t("admin.bookings.detail.messages.paymentReceivedBadge")}
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                    {t("admin.bookings.actions.awaitingPayment")}
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900">{t("admin.bookings.detail.header.title", { code: booking.bookingCode })}</h1>
                <p className="mt-2 text-sm text-slate-600">
                  {booking.customerName} · {booking.vehicle?.name ?? t("admin.bookings.detail.header.vehiclePending")} · {t("admin.bookings.detail.header.createdAt", { date: formatDateTime(booking.createdAt) })}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" size="sm" onClick={copyBookingCode} className="rounded-xl">
                  <Copy className="h-4 w-4" />
                  {t("admin.bookings.detail.actions.copyCode")}
                </Button>
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={() => router.push(`/${locale}/admin/bookings/${booking.id}/edit`)} className="rounded-xl">
                    {t("admin.bookings.detail.actions.editBooking")}
                  </Button>
                )}
                {hasOpenBillingDoc && (
                  <a href={invoiceDownloadUrl || booking.invoiceUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <FileText className="h-4 w-4" />
                      {t("admin.bookings.detail.actions.openBillingDoc")}
                    </Button>
                  </a>
                )}
              </div>
            </div>

            <div className="grid min-w-0 gap-3 sm:grid-cols-3 xl:min-w-[420px]">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("admin.bookings.detail.summaryCards.total")}</p>
                <p className="mt-2 text-2xl font-black text-slate-900">${(computedTotalAmount / 100).toFixed(2)}</p>
                <p className="mt-1 text-xs text-slate-500">{t("admin.bookings.detail.summaryCards.totalHint")}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("admin.bookings.detail.trip.fields.pickup")}</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(booking.startDate)}</p>
                <p className="mt-1 text-xs text-slate-500">{booking.pickupLocationRef?.name || booking.pickupLocation || "-"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("admin.bookings.detail.trip.fields.dropoff")}</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(booking.endDate)}</p>
                <p className="mt-1 text-xs text-slate-500">{booking.dropoffLocationRef?.name || booking.dropoffLocation || "-"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("admin.bookings.table.actions")}</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">{t("admin.bookings.detail.operations.title")}</h2>
                <p className="mt-1 text-sm text-slate-600">{t("admin.bookings.detail.operations.description")}</p>
                {!booking.paymentReceivedAt && !booking.deliveredAt ? (
                  <p className="mt-2 text-sm text-amber-700">
                    {t("admin.bookings.detail.operations.deliverHint")}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {canConfirm && (
                  <Button onClick={handleConfirm} disabled={isLoading} className="rounded-xl">
                    <ClipboardCheck className="h-4 w-4" />
                    {isLoading ? t("admin.bookings.detail.actions.processing") : t("admin.bookings.detail.actions.confirm")}
                  </Button>
                )}
                {canSendInvoice && (
                  <Button onClick={handleSendInvoiceEstimate} disabled={isLoading} variant="outline" className="rounded-xl">
                    <Mail className="h-4 w-4" />
                    {booking.invoiceUrl ? t("admin.bookings.detail.actions.resendInvoice") : t("admin.bookings.detail.actions.sendInvoice")}
                  </Button>
                )}
                {canCreateSalesReceipt && (
                  <Button onClick={() => setShowSalesReceiptDialog(true)} disabled={isLoading} variant="outline" className="rounded-xl">
                    <Receipt className="h-4 w-4" />
                    {t("admin.bookings.detail.actions.salesReceipt")}
                  </Button>
                )}
                {canReceivePayment && (
                  <Button onClick={() => setConfirmAction("payment")} disabled={isLoading} variant="outline" className="rounded-xl">
                    <Wallet className="h-4 w-4" />
                    {t("admin.bookings.detail.actions.receivePayment")}
                  </Button>
                )}
                {canMarkDelivered && (
                  <Button onClick={() => setShowPickupInspection(true)} disabled={isLoading} variant="outline" className="rounded-xl">
                    <Truck className="h-4 w-4" />
                    {t("admin.bookings.detail.inspection.title.pickup")}
                  </Button>
                )}
                {canMarkReturned && (
                  <Button onClick={() => setShowReturnInspection(true)} disabled={isLoading} variant="outline" className="rounded-xl">
                    <Undo2 className="h-4 w-4" />
                    {t("admin.bookings.detail.inspection.title.return")}
                  </Button>
                )}
                {canDecline && (
                  <Button onClick={() => setShowDeclineDialog(true)} disabled={isLoading} variant="destructive" className="rounded-xl">
                    <ClipboardX className="h-4 w-4" />
                    {t("common.decline")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {booking.status === "PENDING" && (
        <Alert className="rounded-2xl border-amber-200 bg-amber-50/80">
          <AlertCircle className="h-4 w-4 text-amber-700" />
          <AlertDescription className="text-amber-900">
            {t("admin.bookings.detail.pendingAlert")}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-2 text-slate-700"><Banknote className="h-5 w-5" /></div>
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{t("admin.bookings.detail.summaryCards.billing")}</p>
              <p className="mt-1 text-base font-bold text-slate-900">${(computedTotalAmount / 100).toFixed(2)}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            {vehicleRatesIncludeTax
              ? t("admin.bookings.detail.billing.taxExtrasInline", { amount: (taxAmount / 100).toFixed(2) })
              : t("admin.bookings.detail.billing.taxBookingInline", { amount: (taxAmount / 100).toFixed(2) })}
          </p>
          <p className="mt-1 text-sm text-slate-600">{t("admin.bookings.detail.billing.fuelRateInline", { amount: (categoryFuelChargePerQuarter / 100).toFixed(2) })}</p>
          {!booking.returnedAt && liveLateReturnPreview.chargeCents > 0 ? (
            <p className="mt-1 text-sm text-amber-700">{t("admin.bookings.detail.billing.liveLatePreview", { amount: (liveLateReturnPreview.chargeCents / 100).toFixed(2), days: liveLateReturnPreview.lateDays })}</p>
          ) : null}
        </Card>
        <Card className="rounded-2xl border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-2 text-slate-700"><CalendarClock className="h-5 w-5" /></div>
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{t("admin.bookings.detail.summaryCards.rentalWindow")}</p>
                <p className="mt-1 text-base font-bold text-slate-900">{rentalDaysLabel}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-600">{formatDate(booking.startDate)} to {formatDate(booking.endDate)}</p>
        </Card>
        <Card className="rounded-2xl border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-2 text-slate-700"><CarFront className="h-5 w-5" /></div>
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{t("admin.bookings.detail.trip.fields.vehicle")}</p>
              <p className="mt-1 text-base font-bold text-slate-900">{booking.vehicle?.name ?? "-"}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-600">{t("admin.bookings.detail.summaryCards.categoryInline", { category: booking.category?.name || "-" })}</p>
        </Card>
        <Card className="rounded-2xl border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-2 text-slate-700"><CheckCircle2 className="h-5 w-5" /></div>
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{t("admin.bookings.detail.summaryCards.lifecycle")}</p>
                <p className="mt-1 text-base font-bold text-slate-900">{lifecycleLabel}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-600">{lifecycleDateLabel}</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.95fr)]">
        <div className="space-y-6">
          <Card className="rounded-2xl border-slate-200 p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-2 text-slate-700"><UserRound className="h-5 w-5" /></div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t("admin.bookings.detail.customerProfile.title")}</h2>
                <p className="text-sm text-slate-600">{t("admin.bookings.detail.customerProfile.description")}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t("common.name")}</p><p className="mt-1 font-medium text-slate-900">{booking.customerName}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t("common.email")}</p><p className="mt-1 font-medium text-slate-900">{booking.customerEmail}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t("common.phone")}</p><p className="mt-1 font-medium text-slate-900">{booking.customerPhone}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t("admin.bookings.detail.customerProfile.fields.flightNumber")}</p><p className="mt-1 font-medium text-slate-900">{booking.flightNumber || "-"}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t("admin.bookings.detail.customerProfile.fields.birthDate")}</p><p className="mt-1 font-medium text-slate-900">{booking.birthDate ? formatDate(booking.birthDate) : "-"}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t("admin.bookings.detail.customerProfile.fields.licenseNumber")}</p><p className="mt-1 font-medium text-slate-900">{booking.driverLicenseNumber || "-"}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t("admin.bookings.detail.customerProfile.fields.licenseExpiry")}</p><p className="mt-1 font-medium text-slate-900">{booking.licenseExpiryDate ? formatDate(booking.licenseExpiryDate) : "-"}</p></div>
            </div>
          </Card>

          <Card className="rounded-2xl border-slate-200 p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-2 text-slate-700"><MapPin className="h-5 w-5" /></div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t("admin.bookings.detail.trip.title")}</h2>
                <p className="text-sm text-slate-600">{t("admin.bookings.detail.trip.description")}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t("admin.bookings.detail.trip.fields.vehicle")}</p><p className="mt-1 font-medium text-slate-900">{booking.vehicle?.name ?? "-"}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t("admin.bookings.detail.trip.fields.category")}</p><p className="mt-1 font-medium text-slate-900">{booking.category?.name || "-"}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t("admin.bookings.detail.trip.fields.pickup")}</p><p className="mt-1 font-medium text-slate-900">{formatDateTime(booking.startDate)}</p></div>
              <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t("admin.bookings.detail.trip.fields.dropoff")}</p><p className="mt-1 font-medium text-slate-900">{formatDateTime(booking.endDate)}</p></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t("admin.bookings.detail.trip.fields.pickupLocation")}</p>
                <p className="mt-1 font-medium text-slate-900">{booking.pickupLocationRef?.name || booking.pickupLocation || "-"}</p>
                {pickupMapUrl && <a href={pickupMapUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline">{t("admin.bookings.detail.trip.openMap")}</a>}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t("admin.bookings.detail.trip.fields.dropoffLocation")}</p>
                <p className="mt-1 font-medium text-slate-900">{booking.dropoffLocationRef?.name || booking.dropoffLocation || "-"}</p>
                {dropoffMapUrl && <a href={dropoffMapUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline">{t("admin.bookings.detail.trip.openMap")}</a>}
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-slate-200 p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-2 text-slate-700"><PackagePlus className="h-5 w-5" /></div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t("admin.bookings.detail.pricing.title")}</h2>
                <p className="text-sm text-slate-600">{t("admin.bookings.detail.pricing.description")}</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-sm font-semibold text-slate-900">{t("admin.bookings.detail.pricing.applyDiscount")}</p>
                <p className="mt-1 text-sm text-slate-600">{t("admin.bookings.detail.pricing.discountHint")}</p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    list="discount-codes"
                    placeholder={t("admin.bookings.detail.pricing.enterCode")}
                    className="rounded-xl bg-white"
                  />
                  <Button onClick={handleApplyDiscount} disabled={isLoading} className="rounded-xl">
                    {t("admin.bookings.detail.pricing.apply")}
                  </Button>
                </div>
                <datalist id="discount-codes">
                  {discountCodes.map((d) => (
                    <option key={d.id} value={d.code}>
                      {d.code} ({d.percentage}%)
                    </option>
                  ))}
                </datalist>
                {booking.bookingDiscount && (
                  <p className="mt-3 text-xs text-slate-500">
                    {t("admin.bookings.detail.pricing.activeDiscount", { code: booking.bookingDiscount.discountCode?.code, percentage: booking.bookingDiscount.percentage })}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-sm font-semibold text-slate-900">{t("admin.bookings.detail.pricing.addExtra")}</p>
                <p className="mt-1 text-sm text-slate-600">{t("admin.bookings.detail.pricing.extraHint")}</p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <select
                    value={extraId}
                    onChange={(e) => setExtraId(e.target.value)}
                    className="h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-white px-3 text-sm"
                  >
                    <option value="">{t("admin.bookings.detail.pricing.selectExtra")}</option>
                    {extras.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name} ({ex.pricingType}, ${(ex.amount / 100).toFixed(2)})
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={1}
                    value={extraQty}
                    onChange={(e) => setExtraQty(Math.max(1, parseInt(e.target.value || "1", 10)))}
                    className="w-full rounded-xl bg-white sm:w-24"
                  />
                  <Button onClick={handleAddExtra} disabled={isLoading} className="rounded-xl">
                    {t("admin.bookings.detail.pricing.add")}
                  </Button>
                </div>
              </div>
            </div>

            {!!booking.bookingExtras?.length && (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">{t("admin.bookings.detail.pricing.currentExtras")}</p>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  {booking.bookingExtras.map((line: any) => (
                    <div key={line.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <span>{line.extra?.name} x{line.quantity}</span>
                      <span className="font-medium text-slate-900">${(line.lineTotal / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border-slate-200 p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-2 text-slate-700"><Receipt className="h-5 w-5" /></div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t("admin.bookings.detail.billing.title")}</h2>
                <p className="text-sm text-slate-600">{t("admin.bookings.detail.billing.description")}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="text-slate-600">{t("admin.bookings.detail.billing.baseRental")}</span><span className="font-semibold text-slate-900">${(baseAmount / 100).toFixed(2)}</span></div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="text-slate-600">{t("admin.bookings.detail.billing.extras")}</span><span className="font-semibold text-slate-900">${(extrasAmount / 100).toFixed(2)}</span></div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="text-slate-600">{t("admin.bookings.detail.billing.discount")}</span><span className="font-semibold text-slate-900">-${(discountAmount / 100).toFixed(2)}</span></div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="text-slate-600">{vehicleRatesIncludeTax ? t("admin.bookings.detail.billing.subtotalBeforeExtraTax") : t("admin.bookings.detail.billing.subtotalBeforeTax")}</span><span className="font-semibold text-slate-900">${(subtotalBeforeTax / 100).toFixed(2)}</span></div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="text-slate-600">{vehicleRatesIncludeTax ? t("admin.bookings.detail.billing.taxOnExtras", { tax: taxPercentage }) : t("admin.bookings.detail.billing.taxOnBooking", { tax: taxPercentage })}</span><span className="font-semibold text-slate-900">${(taxAmount / 100).toFixed(2)}</span></div>
              {closeoutLateCharge > 0 ? (
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="text-slate-600">{t("admin.bookings.detail.billing.lateReturnCharge")}</span><span className="font-semibold text-slate-900">${(closeoutLateCharge / 100).toFixed(2)}</span></div>
              ) : null}
              {closeoutFuelCharge > 0 ? (
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="text-slate-600">{t("admin.bookings.detail.billing.fuelDifferenceCharge")}</span><span className="font-semibold text-slate-900">${(closeoutFuelCharge / 100).toFixed(2)}</span></div>
              ) : null}
              {closeoutDamageCharge > 0 ? (
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="text-slate-600">{t("admin.bookings.detail.billing.returnDamageCharge")}</span><span className="font-semibold text-slate-900">${(closeoutDamageCharge / 100).toFixed(2)}</span></div>
              ) : null}
              <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-4 text-white"><span className="font-semibold">{t("admin.bookings.detail.billing.totalAmount")}</span><span className="text-lg font-black">${(computedTotalAmount / 100).toFixed(2)}</span></div>
            </div>
          </Card>

          <Card className="rounded-2xl border-slate-200 p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-2 text-slate-700"><Wallet className="h-5 w-5" /></div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t("admin.bookings.detail.sync.title")}</h2>
                <p className="text-sm text-slate-600">{t("admin.bookings.detail.sync.description")}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between"><span>{t("admin.bookings.detail.sync.paymentReceived")}</span><span className="font-medium text-slate-900">{booking.paymentReceivedAt ? formatDateTime(booking.paymentReceivedAt) : t("common.no")}</span></div>
              <div className="flex items-center justify-between"><span>{t("admin.bookings.detail.sync.billingDocument")}</span><span className="font-medium text-slate-900">{booking.billingDocumentType || t("admin.bookings.detail.sync.notGenerated")}</span></div>
              <div className="flex items-center justify-between">
                <span>{accountingProvider === "ZOHO" ? t("admin.bookings.detail.sync.zohoTransfer") : t("admin.bookings.detail.sync.quickbooksTransfer")}</span>
                <span className="font-medium text-slate-900">
                  {accountingProvider === "ZOHO"
                    ? `${booking.zohoTransferStatus || t("admin.bookings.detail.sync.notQueued")}${booking.zohoDocumentType ? ` (${booking.zohoDocumentType})` : ""}`
                    : `${booking.quickBooksTransferStatus || t("admin.bookings.detail.sync.notQueued")}${booking.quickBooksDocumentType ? ` (${booking.quickBooksDocumentType})` : ""}`}
                </span>
              </div>
              <div className="flex items-center justify-between"><span>{t("admin.bookings.actions.delivered")}</span><span className="font-medium text-slate-900">{booking.deliveredAt ? formatDateTime(booking.deliveredAt) : t("common.no")}</span></div>
              <div className="flex items-center justify-between"><span>{t("admin.bookings.actions.returned")}</span><span className="font-medium text-slate-900">{booking.returnedAt ? formatDateTime(booking.returnedAt) : t("common.no")}</span></div>
              {(accountingProvider === "ZOHO" ? booking.zohoLastError : booking.quickBooksLastError) && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-rose-800">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em]">{accountingProvider === "ZOHO" ? t("admin.bookings.detail.sync.zohoError") : t("admin.bookings.detail.sync.quickbooksError")}</p>
                  <p className="mt-1 text-sm">{accountingProvider === "ZOHO" ? booking.zohoLastError : booking.quickBooksLastError}</p>
                </div>
              )}
              {(role === "ROOT" || role === "OWNER") && accountingProvider !== "NONE" && (
                <a href={`/${locale}/admin/${accountingProvider === "ZOHO" ? "zoho" : "quickbooks"}`} className="inline-flex text-sm font-medium text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline">
                  {accountingProvider === "ZOHO" ? t("admin.bookings.detail.sync.openZohoTransfers") : t("admin.bookings.detail.sync.openQuickbooksTransfers")}
                </a>
              )}
            </div>
          </Card>

          <Card className="rounded-2xl border-slate-200 p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-2 text-slate-700"><CarFront className="h-5 w-5" /></div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t("admin.bookings.detail.conditionLog.title")}</h2>
                <p className="text-sm text-slate-600">{t("admin.bookings.detail.conditionLog.description")}</p>
              </div>
            </div>
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{t("admin.bookings.detail.conditionLog.pickupInspection")}</p>
                  <span className="text-sm text-slate-500">{booking.pickupAcceptedAt ? formatDateTime(booking.pickupAcceptedAt) : t("admin.bookings.detail.conditionLog.notCompleted")}</span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between"><span>{t("admin.bookings.detail.conditionLog.odometer")}</span><span className="font-medium text-slate-900">{booking.pickupOdometerKm ?? "-"}</span></div>
                  <div className="flex items-center justify-between"><span>{t("admin.bookings.detail.conditionLog.fuel")}</span><span className="font-medium text-slate-900">{getFuelLevelLabel(booking.pickupFuelLevel)}</span></div>
                  <div className="flex items-center justify-between"><span>{t("admin.bookings.detail.conditionLog.damageRecorded")}</span><span className="font-medium text-slate-900">{booking.pickupHasDamage ? t("common.yes") : t("common.no")}</span></div>
                  <div className="flex items-center justify-between"><span>{t("admin.bookings.detail.conditionLog.acceptedBy")}</span><span className="font-medium text-slate-900">{booking.pickupAcceptedBy || "-"}</span></div>
                </div>
                {booking.pickupDamageNotes ? <p className="mt-3 rounded-xl bg-white px-3 py-3 text-sm text-slate-700">{booking.pickupDamageNotes}</p> : null}
                {pickupPhotos.length > 0 ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {pickupPhotos.map((photo: any) => (
                      <img key={photo.id} src={getBlobProxyUrl(photo.imageUrl) || photo.imageUrl} alt={t("admin.bookings.detail.conditionLog.pickupPhotoAlt")} className="h-28 w-full rounded-xl object-cover" />
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{t("admin.bookings.detail.conditionLog.returnInspection")}</p>
                  <span className="text-sm text-slate-500">{booking.returnAcceptedAt ? formatDateTime(booking.returnAcceptedAt) : t("admin.bookings.detail.conditionLog.notCompleted")}</span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between"><span>{t("admin.bookings.detail.conditionLog.odometer")}</span><span className="font-medium text-slate-900">{booking.returnOdometerKm ?? "-"}</span></div>
                  <div className="flex items-center justify-between"><span>{t("admin.bookings.detail.conditionLog.fuel")}</span><span className="font-medium text-slate-900">{getFuelLevelLabel(booking.returnFuelLevel)}</span></div>
                  <div className="flex items-center justify-between"><span>{t("admin.bookings.detail.conditionLog.damageRecorded")}</span><span className="font-medium text-slate-900">{booking.returnHasDamage ? t("common.yes") : t("common.no")}</span></div>
                  <div className="flex items-center justify-between"><span>{t("admin.bookings.detail.conditionLog.acceptedBy")}</span><span className="font-medium text-slate-900">{booking.returnAcceptedBy || "-"}</span></div>
                  <div className="flex items-center justify-between"><span>{t("admin.bookings.detail.conditionLog.scheduledDropoff")}</span><span className="font-medium text-slate-900">{formatDateTime(booking.endDate)}</span></div>
                  <div className="flex items-center justify-between"><span>{t("admin.bookings.detail.conditionLog.actualReturn")}</span><span className="font-medium text-slate-900">{booking.returnedAt ? formatDateTime(booking.returnedAt) : "-"}</span></div>
                  <div className="flex items-center justify-between"><span>{t("admin.bookings.detail.billing.lateReturnCharge")}</span><span className="font-medium text-slate-900">${(closeoutLateCharge / 100).toFixed(2)}</span></div>
                </div>
                {booking.returnDamageNotes ? <p className="mt-3 rounded-xl bg-white px-3 py-3 text-sm text-slate-700">{booking.returnDamageNotes}</p> : null}
                {returnPhotos.length > 0 ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {returnPhotos.map((photo: any) => (
                      <img key={photo.id} src={getBlobProxyUrl(photo.imageUrl) || photo.imageUrl} alt={t("admin.bookings.detail.conditionLog.returnPhotoAlt")} className="h-28 w-full rounded-xl object-cover" />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-slate-200 p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-2 text-slate-700"><FileText className="h-5 w-5" /></div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t("admin.bookings.detail.files")}</h2>
                <p className="text-sm text-slate-600">{t("admin.bookings.detail.filesCard.description")}</p>
              </div>
            </div>
            <div className="space-y-4">
              <DocumentPreview
                url={booking.driverLicenseUrl}
                title={t("booking.driverLicense")}
                openLabel={t("booking.openOriginal")}
                emptyLabel={t("booking.documentUnavailable")}
              />
              {booking.paymentProofUrl && (
                <a href={booking.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex text-sm font-medium text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline">
                  {t("admin.bookings.detail.filesCard.openPaymentProof")}
                </a>
              )}
              {booking.invoiceUrl && (
                <div className="flex flex-wrap items-center gap-3">
                  <a href={invoiceDownloadUrl || booking.invoiceUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="rounded-xl">
                      <FileText className="h-4 w-4" />
                      {t("admin.bookings.detail.actions.openBillingDoc")}
                    </Button>
                  </a>
                  <SendBillingEmailButton
                    bookingId={booking.id}
                    locale={locale}
                    label={t("admin.bookings.detail.filesActions.sendByEmail")}
                    className="rounded-xl border border-[hsl(var(--input))] bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  />
                </div>
              )}
            </div>
          </Card>

          {booking.notes && (
            <Card className="rounded-2xl border-slate-200 p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-slate-100 p-2 text-slate-700"><Mail className="h-5 w-5" /></div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{t("admin.bookings.detail.notesCard.title")}</h2>
                  <p className="text-sm text-slate-600">{t("admin.bookings.detail.notesCard.description")}</p>
                </div>
              </div>
              <Separator className="mb-4" />
              <p className="text-sm leading-7 text-slate-700">{booking.notes}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

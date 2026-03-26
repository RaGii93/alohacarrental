/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { isLicenseActive } from "@/lib/license";
import { getSession } from "@/lib/session";
import { logAdminAction } from "@/lib/audit";
import { getQuickBooksFeatureSettings } from "@/lib/settings";
import {
  ensureQuickBooksBookingColumns,
  loadBookingQuickBooksSyncPayload,
  markBookingQuickBooksCompleted,
  markBookingQuickBooksFailed,
  queueBookingQuickBooksTransfer,
  resolveBookingQuickBooksTransfer,
} from "@/lib/quickbooks-bookings";
import {
  receiveQuickBooksInvoicePayment,
  refreshQuickBooksNameListCache,
  syncQuickBooksInvoice,
  syncQuickBooksSalesReceipt,
} from "@/lib/quickbooks";

function toQuickBooksPayload(booking: NonNullable<Awaited<ReturnType<typeof loadBookingQuickBooksSyncPayload>>>) {
  return {
    bookingCode: booking.bookingCode,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    customerPhone: booking.customerPhone,
    totalAmountCents: booking.totalAmount,
    startDate: booking.startDate,
    endDate: booking.endDate,
  };
}

async function requireQuickBooksAdmin() {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Unauthorized" };
  if (session.role !== "ROOT" && session.role !== "OWNER") {
    return { ok: false as const, error: "Forbidden" };
  }
  if (!isLicenseActive() && session.role !== "ROOT") {
    return { ok: false as const, error: "BOOKING_DISABLED" };
  }
  const quickBooks = await getQuickBooksFeatureSettings();
  if (!quickBooks.enabled) {
    return { ok: false as const, error: "QuickBooks is disabled" };
  }
  return { ok: true as const, session };
}

export async function syncBookingQuickBooksTransferAction(bookingId: string, locale: string) {
  const auth = await requireQuickBooksAdmin();
  if (!auth.ok) return { success: false as const, error: auth.error };

  const booking = await loadBookingQuickBooksSyncPayload(bookingId);
  if (!booking) return { success: false as const, error: "Booking not found" };

  const plan = resolveBookingQuickBooksTransfer(booking);
  if (!plan) {
    return { success: false as const, error: "Billing document required before QuickBooks transfer" };
  }

  await queueBookingQuickBooksTransfer(bookingId, plan.documentType);

  try {
    const payload = toQuickBooksPayload(booking);
    if (plan.kind === "invoice") {
      const result = await syncQuickBooksInvoice(payload);
      if (!result.success) throw new Error(result.error || "QuickBooks invoice sync failed");
      await markBookingQuickBooksCompleted(bookingId, "INVOICE", {
        customerId: result.customerId,
        invoiceId: result.invoiceId,
      });
      await logAdminAction({
        adminUserId: auth.session.adminUserId,
        action: "QUICKBOOKS_INVOICE_TRANSFER_COMPLETED",
        bookingId,
      });
    } else if (plan.kind === "sales_receipt") {
      const result = await syncQuickBooksSalesReceipt(payload, {
        customerId: booking.quickBooksCustomerId || undefined,
      });
      if (!result.success) throw new Error(result.error || "QuickBooks sales receipt sync failed");
      await markBookingQuickBooksCompleted(bookingId, "SALES_RECEIPT", {
        customerId: result.customerId,
        salesReceiptId: result.salesReceiptId,
      });
      await logAdminAction({
        adminUserId: auth.session.adminUserId,
        action: "QUICKBOOKS_SALES_RECEIPT_TRANSFER_COMPLETED",
        bookingId,
      });
    } else {
      const invoiceResult = await syncQuickBooksInvoice(payload);
      if (!invoiceResult.success) throw new Error(invoiceResult.error || "QuickBooks invoice sync failed");
      const result = await receiveQuickBooksInvoicePayment(payload, {
        customerId: booking.quickBooksCustomerId || invoiceResult.customerId || undefined,
        invoiceId: booking.quickBooksInvoiceId || invoiceResult.invoiceId || undefined,
      });
      if (!result.success) throw new Error(result.error || "QuickBooks payment sync failed");
      await markBookingQuickBooksCompleted(bookingId, "PAYMENT", {
        customerId: result.customerId,
        invoiceId: result.invoiceId,
        paymentId: result.paymentId,
      });
      await logAdminAction({
        adminUserId: auth.session.adminUserId,
        action: "QUICKBOOKS_PAYMENT_TRANSFER_COMPLETED",
        bookingId,
      });
    }

    revalidatePath(`/${locale}/admin/quickbooks`);
    revalidatePath(`/${locale}/admin/bookings/${bookingId}`);
    revalidatePath(`/${locale}/admin/bookings`);
    return { success: true as const };
  } catch (error: any) {
    const message = String(error?.message || "QuickBooks transfer failed");
    await markBookingQuickBooksFailed(bookingId, plan.documentType, message);
    await logAdminAction({
      adminUserId: auth.session.adminUserId,
      action: "QUICKBOOKS_TRANSFER_FAILED",
      bookingId,
    });
    revalidatePath(`/${locale}/admin/quickbooks`);
    revalidatePath(`/${locale}/admin/bookings/${bookingId}`);
    return { success: false as const, error: message };
  }
}

export async function syncPendingQuickBooksTransfersAction(locale: string) {
  const auth = await requireQuickBooksAdmin();
  if (!auth.ok) return { success: false as const, error: auth.error };

  await ensureQuickBooksBookingColumns();
  const rows = await db.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM "Booking"
    WHERE "quickBooksTransferStatus" = 'PENDING'::"QuickBooksTransferStatus"
    ORDER BY COALESCE("quickBooksSyncRequestedAt", "createdAt") ASC
    LIMIT 25
  `;

  let completed = 0;
  const failures: Array<{ id: string; error: string }> = [];
  for (const row of rows) {
    const result = await syncBookingQuickBooksTransferAction(row.id, locale);
    if (result.success) completed += 1;
    else failures.push({ id: row.id, error: result.error || "QuickBooks transfer failed" });
  }

  revalidatePath(`/${locale}/admin/quickbooks`);
  return { success: true as const, completed, failures };
}

export async function refreshQuickBooksNameCacheAction(locale: string) {
  const auth = await requireQuickBooksAdmin();
  if (!auth.ok) return { success: false as const, error: auth.error };

  const result = await refreshQuickBooksNameListCache({ force: true });
  if (!result.success) {
    return { success: false as const, error: result.error };
  }

  await logAdminAction({
    adminUserId: auth.session.adminUserId,
    action: "QUICKBOOKS_NAME_CACHE_REFRESHED",
  });
  revalidatePath(`/${locale}/admin/quickbooks`);
  return { success: true as const, count: result.count };
}

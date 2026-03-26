/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { isLicenseActive } from "@/lib/license";
import { getSession } from "@/lib/session";
import { logAdminAction } from "@/lib/audit";
import { getZohoInvoiceFeatureSettings } from "@/lib/settings";
import {
  ensureZohoBookingColumns,
  loadBookingZohoSyncPayload,
  markBookingZohoCompleted,
  markBookingZohoFailed,
  queueBookingZohoTransfer,
  resolveBookingZohoTransfer,
} from "@/lib/zoho-bookings";
import {
  receiveZohoInvoicePayment,
  syncZohoInvoice,
  syncZohoSalesReceipt,
} from "@/lib/zoho-invoice";

function toZohoPayload(booking: NonNullable<Awaited<ReturnType<typeof loadBookingZohoSyncPayload>>>) {
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

async function requireZohoAdmin() {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Unauthorized" };
  if (session.role !== "ROOT" && session.role !== "OWNER") {
    return { ok: false as const, error: "Forbidden" };
  }
  if (!isLicenseActive() && session.role !== "ROOT") {
    return { ok: false as const, error: "BOOKING_DISABLED" };
  }
  const zoho = await getZohoInvoiceFeatureSettings();
  if (!zoho.enabled) {
    return { ok: false as const, error: "Zoho Invoice is disabled" };
  }
  return { ok: true as const, session };
}

export async function syncBookingZohoTransferAction(bookingId: string, locale: string) {
  const auth = await requireZohoAdmin();
  if (!auth.ok) return { success: false as const, error: auth.error };

  const booking = await loadBookingZohoSyncPayload(bookingId);
  if (!booking) return { success: false as const, error: "Booking not found" };

  const plan = resolveBookingZohoTransfer(booking);
  if (!plan) {
    return { success: false as const, error: "Billing document required before Zoho sync" };
  }

  await queueBookingZohoTransfer(bookingId, plan.documentType);

  try {
    const payload = toZohoPayload(booking);
    if (plan.kind === "invoice") {
      const result = await syncZohoInvoice(payload);
      if (!result.success) throw new Error(result.error || "Zoho invoice sync failed");
      await markBookingZohoCompleted(bookingId, "INVOICE", {
        customerId: result.customerId,
        invoiceId: result.invoiceId,
      });
    } else if (plan.kind === "sales_receipt") {
      const result = await syncZohoSalesReceipt(payload, {
        customerId: booking.zohoCustomerId || undefined,
      });
      if (!result.success) throw new Error(result.error || "Zoho sales receipt sync failed");
      await markBookingZohoCompleted(bookingId, "SALES_RECEIPT", {
        customerId: result.customerId,
        invoiceId: result.invoiceId,
        paymentId: result.paymentId,
      });
    } else {
      const invoiceResult = await syncZohoInvoice(payload);
      if (!invoiceResult.success) throw new Error(invoiceResult.error || "Zoho invoice sync failed");
      const result = await receiveZohoInvoicePayment(payload, {
        customerId: booking.zohoCustomerId || invoiceResult.customerId || undefined,
        invoiceId: booking.zohoInvoiceId || invoiceResult.invoiceId || undefined,
      });
      if (!result.success) throw new Error(result.error || "Zoho payment sync failed");
      await markBookingZohoCompleted(bookingId, "PAYMENT", {
        customerId: result.customerId,
        invoiceId: result.invoiceId,
        paymentId: result.paymentId,
      });
    }

    await logAdminAction({
      adminUserId: auth.session.adminUserId,
      action: "ZOHO_TRANSFER_COMPLETED",
      bookingId,
    });
    revalidatePath(`/${locale}/admin/zoho`);
    revalidatePath(`/${locale}/admin/bookings/${bookingId}`);
    revalidatePath(`/${locale}/admin/bookings`);
    return { success: true as const };
  } catch (error: any) {
    const message = String(error?.message || "Zoho transfer failed");
    await markBookingZohoFailed(bookingId, plan.documentType, message);
    await logAdminAction({
      adminUserId: auth.session.adminUserId,
      action: "ZOHO_TRANSFER_FAILED",
      bookingId,
    });
    revalidatePath(`/${locale}/admin/zoho`);
    revalidatePath(`/${locale}/admin/bookings/${bookingId}`);
    return { success: false as const, error: message };
  }
}

export async function syncPendingZohoTransfersAction(locale: string) {
  const auth = await requireZohoAdmin();
  if (!auth.ok) return { success: false as const, error: auth.error };

  await ensureZohoBookingColumns();
  const rows = await db.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM "Booking"
    WHERE "zohoTransferStatus" = 'PENDING'::"ZohoTransferStatus"
    ORDER BY COALESCE("zohoSyncRequestedAt", "createdAt") ASC
    LIMIT 25
  `;

  let completed = 0;
  const failures: Array<{ id: string; error: string }> = [];
  for (const row of rows) {
    const result = await syncBookingZohoTransferAction(row.id, locale);
    if (result.success) completed += 1;
    else failures.push({ id: row.id, error: result.error || "Zoho transfer failed" });
  }

  revalidatePath(`/${locale}/admin/zoho`);
  return { success: true as const, completed, failures };
}

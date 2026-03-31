"use server";

import { randomUUID } from "crypto";
import { getSession } from "@/lib/session";
import { sendEmail, bookingEmailHtml } from "@/lib/email";
import { getTenantConfig } from "@/lib/tenant";
import { getTermsEmailAttachment } from "@/lib/terms";
import { logAdminAction } from "@/lib/audit";
import { db } from "@/lib/db";
import { ensureExternalRentalTable } from "@/lib/external-rentals";
import { calculateDays } from "@/lib/pricing";

function parseMoneyToCents(value: string) {
  const amount = Number(String(value || "").trim());
  if (!Number.isFinite(amount)) return NaN;
  return Math.round(amount * 100);
}

async function requireExternalRentalAdmin() {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Unauthorized" };
  if (session.role !== "ROOT" && session.role !== "OWNER") {
    return { ok: false as const, error: "Forbidden" };
  }
  return { ok: true as const, session };
}

async function generateExternalBookingCode() {
  let attempts = 0;
  do {
    const bookingCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const rows = await db.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "ExternalRentalBooking" WHERE "bookingCode" = ${bookingCode} LIMIT 1
    `;
    if (!rows[0]) return bookingCode;
    attempts++;
  } while (attempts < 20);

  throw new Error("Failed to generate booking code");
}

export async function createExternalRentalAction(formData: FormData, locale: string) {
  try {
    const auth = await requireExternalRentalAdmin();
    if (!auth.ok) return { success: false as const, error: auth.error };

    await ensureExternalRentalTable();

    const supplierCompany = String(formData.get("supplierCompany") || "").trim();
    const vehicleLabel = String(formData.get("vehicleLabel") || "").trim();
    const customerName = String(formData.get("customerName") || "").trim();
    const customerEmail = String(formData.get("customerEmail") || "").trim();
    const customerPhone = String(formData.get("customerPhone") || "").trim();
    const pickupLocation = String(formData.get("pickupLocation") || "").trim();
    const dropoffLocation = String(formData.get("dropoffLocation") || "").trim();
    const notes = String(formData.get("notes") || "").trim();
    const paymentStatus = String(formData.get("paymentStatus") || "UNPAID").trim().toUpperCase();
    const paymentMethod = String(formData.get("paymentMethod") || "").trim();
    const paymentReference = String(formData.get("paymentReference") || "").trim();
    const startDate = new Date(String(formData.get("startDate") || ""));
    const endDate = new Date(String(formData.get("endDate") || ""));
    const incomeAmountRaw = parseMoneyToCents(String(formData.get("incomeAmount") || ""));
    const expenseAmountRaw = parseMoneyToCents(String(formData.get("expenseAmount") || ""));
    const dailyIncomeRate = parseMoneyToCents(String(formData.get("dailyIncomeRate") || ""));
    const dailyExpenseRate = parseMoneyToCents(String(formData.get("dailyExpenseRate") || ""));

    if (
      !supplierCompany ||
      !vehicleLabel ||
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !pickupLocation ||
      !dropoffLocation ||
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      endDate <= startDate ||
      (
        (!Number.isFinite(incomeAmountRaw) || !Number.isFinite(expenseAmountRaw)) &&
        (!Number.isFinite(dailyIncomeRate) || !Number.isFinite(dailyExpenseRate))
      )
    ) {
      return { success: false as const, error: "Please complete all required fields with valid values." };
    }

    const bookingCode = await generateExternalBookingCode();
    const days = calculateDays(startDate, endDate);
    const incomeAmount = Number.isFinite(dailyIncomeRate) ? dailyIncomeRate * days : incomeAmountRaw;
    const expenseAmount = Number.isFinite(dailyExpenseRate) ? dailyExpenseRate * days : expenseAmountRaw;
    const normalizedPaymentStatus = paymentStatus === "PAID" ? "PAID" : "UNPAID";

    if (!Number.isFinite(incomeAmount) || !Number.isFinite(expenseAmount) || incomeAmount < 0 || expenseAmount < 0) {
      return { success: false as const, error: "Daily pricing must be valid and cannot be negative." };
    }

    const profitAmount = incomeAmount - expenseAmount;
    const id = randomUUID();

    await db.$executeRaw`
      INSERT INTO "ExternalRentalBooking" (
        id,
        "bookingCode",
        "supplierCompany",
        "vehicleLabel",
        "customerName",
        "customerEmail",
        "customerPhone",
        "startDate",
        "endDate",
        "pickupLocation",
        "dropoffLocation",
        "incomeAmount",
        "expenseAmount",
        "profitAmount",
        status,
        "paymentStatus",
        "paymentMethod",
        "paymentReference",
        "financialTransferStatus",
        notes,
        "paymentReceivedAt"
      )
      VALUES (
        ${id},
        ${bookingCode},
        ${supplierCompany},
        ${vehicleLabel},
        ${customerName},
        ${customerEmail},
        ${customerPhone},
        ${startDate},
        ${endDate},
        ${pickupLocation},
        ${dropoffLocation},
        ${incomeAmount},
        ${expenseAmount},
        ${profitAmount},
        ${"CONFIRMED"},
        ${normalizedPaymentStatus},
        ${paymentMethod || null},
        ${paymentReference || null},
        ${"PENDING"},
        ${notes || null},
        ${normalizedPaymentStatus === "PAID" ? new Date() : null}
      )
    `;

    try {
      const tenant = await getTenantConfig();
      const terms = await getTermsEmailAttachment();
      const html = await bookingEmailHtml({
        title: "Your booking has been confirmed",
        customerName,
        bookingCode,
        startDate,
        endDate,
        totalAmountCents: incomeAmount,
        introText:
          "Your booking has been arranged successfully. We have reserved the requested vehicle for your selected dates and will contact you if anything else is needed before pickup.",
        outroText:
          "If you need to update this reservation or have any questions before pickup, please contact us and we will be happy to assist.",
        termsUrl: terms.url,
      });

      await sendEmail({
        to: customerEmail,
        subject: `Booking Confirmed - ${bookingCode}`,
        html,
        attachments: terms.attachment ? [terms.attachment] : [],
      });
      await sendEmail({
        to: tenant.email,
        subject: `Partner Rental Created - ${bookingCode}`,
        html,
      });

      await db.$executeRaw`
        UPDATE "ExternalRentalBooking"
        SET "emailSentAt" = NOW()
        WHERE id = ${id}
      `;
    } catch {}

    await logAdminAction({
      adminUserId: auth.session.adminUserId,
      action: "EXTERNAL_RENTAL_CREATED",
    });

    return { success: true as const, bookingCode };
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to create partner rental" };
  }
}

export async function markExternalRentalTransferredAction(id: string, locale: string) {
  try {
    const auth = await requireExternalRentalAdmin();
    if (!auth.ok) return { success: false as const, error: auth.error };

    await ensureExternalRentalTable();

    await db.$executeRaw`
      UPDATE "ExternalRentalBooking"
      SET "financialTransferStatus" = 'TRANSFERRED',
          "transferredAt" = NOW()
      WHERE id = ${id}
    `;

    await logAdminAction({
      adminUserId: auth.session.adminUserId,
      action: "EXTERNAL_RENTAL_TRANSFERRED",
    });

    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to update transfer status" };
  }
}

export async function updateExternalRentalFlowAction(
  input: {
    id: string;
    action: "PAID" | "PICKED_UP" | "RETURNED";
    paymentMethod?: string;
    paymentReference?: string;
    note?: string;
  },
  locale: string
) {
  try {
    const auth = await requireExternalRentalAdmin();
    if (!auth.ok) return { success: false as const, error: auth.error };

    await ensureExternalRentalTable();

    if (input.action === "PAID") {
      await db.$executeRaw`
        UPDATE "ExternalRentalBooking"
        SET
          "paymentStatus" = 'PAID',
          "paymentMethod" = ${String(input.paymentMethod || "").trim() || null},
          "paymentReference" = ${String(input.paymentReference || "").trim() || null},
          "paymentReceivedAt" = COALESCE("paymentReceivedAt", NOW())
        WHERE id = ${input.id}
      `;
    }

    if (input.action === "PICKED_UP") {
      await db.$executeRaw`
        UPDATE "ExternalRentalBooking"
        SET
          "pickedUpAt" = COALESCE("pickedUpAt", NOW()),
          "pickupNotes" = ${String(input.note || "").trim() || null}
        WHERE id = ${input.id}
      `;
    }

    if (input.action === "RETURNED") {
      await db.$executeRaw`
        UPDATE "ExternalRentalBooking"
        SET
          "returnedAt" = COALESCE("returnedAt", NOW()),
          "returnNotes" = ${String(input.note || "").trim() || null}
        WHERE id = ${input.id}
      `;
    }

    await logAdminAction({
      adminUserId: auth.session.adminUserId,
      action: `EXTERNAL_RENTAL_${input.action}`,
    });

    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error?.message || "Failed to update partner rental flow" };
  }
}

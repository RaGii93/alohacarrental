/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isLicenseActive } from "@/lib/license";
import { uploadBuffer, uploadFile } from "@/lib/uploads";
import { adminCategoryBookingUpdateSchemaRefined, categoryBookingFormSchemaRefined } from "@/lib/validators";
import { bookingEmailHtml, sendEmail } from "@/lib/email";
import { getTenantConfig } from "@/lib/tenant";
import { generateInvoicePDF } from "@/lib/pdf";
import { getBlobProxyUrl } from "@/lib/blob";
import { calculateDriverLicenseDeleteAfter } from "@/lib/driver-license-retention";
import { formatDate, parseKralendijkDate, parseKralendijkDateTime } from "@/lib/datetime";
import { getBookingHoldDays, getBookingRuleSettings, getInvoiceProvider, getTaxPercentage, getVehicleRatesIncludeTax } from "@/lib/settings";
import { logAdminAction } from "@/lib/audit";
import { calculateBookingAmounts, calculateFuelDifferenceCharge, calculateLateReturnCharge, evaluateBookingRules, getFuelChargePerQuarterForCategory } from "@/lib/pricing";
import { createNotification } from "@/lib/notifications";
import { getTermsEmailAttachment } from "@/lib/terms";
import {
  ensureQuickBooksBookingColumns,
  markBookingBillingDocument,
  queueBookingQuickBooksTransfer,
} from "@/lib/quickbooks-bookings";
import { ensureVehicleBlockoutsTable } from "@/lib/vehicle-blockouts";
import { ensureZohoBookingColumns, markBookingBillingDocumentZoho, queueBookingZohoTransfer } from "@/lib/zoho-bookings";

type BookingDocumentType = "INVOICE" | "SALES_RECEIPT" | "RENTAL_AGREEMENT";

async function getCustomerTermsEmailData() {
  const terms = await getTermsEmailAttachment();
  return {
    termsUrl: terms.url,
    attachments: terms.attachment ? [terms.attachment] : [],
  };
}

async function markBookingBillingDocumentForActiveProvider(bookingId: string, documentType: "INVOICE" | "SALES_RECEIPT") {
  const invoiceProvider = await getInvoiceProvider();
  if (invoiceProvider === "QUICKBOOKS") {
    await ensureQuickBooksBookingColumns();
    await markBookingBillingDocument(bookingId, documentType);
    return invoiceProvider;
  }
  if (invoiceProvider === "ZOHO") {
    await ensureZohoBookingColumns();
    await markBookingBillingDocumentZoho(bookingId, documentType);
    return invoiceProvider;
  }
  await db.booking.update({
    where: { id: bookingId },
    data: { billingDocumentType: documentType },
  });
  return invoiceProvider;
}

async function queuePaymentTransferForActiveProvider(bookingId: string) {
  const invoiceProvider = await getInvoiceProvider();
  if (invoiceProvider === "QUICKBOOKS") {
    await ensureQuickBooksBookingColumns();
    await queueBookingQuickBooksTransfer(bookingId, "PAYMENT");
    return invoiceProvider;
  }
  if (invoiceProvider === "ZOHO") {
    await ensureZohoBookingColumns();
    await queueBookingZohoTransfer(bookingId, "PAYMENT");
    return invoiceProvider;
  }
  return invoiceProvider;
}

function buildDeclineEmailContent(params: {
  reason?: string | null;
  automatic?: boolean;
}) {
  const trimmedReason = String(params.reason || "").trim();

  if (params.automatic) {
    return {
      subject: "We’re Sorry, Your Booking Request Has Expired",
      title: "We’re sorry, your booking request has expired",
      introText:
        "We sincerely apologize, but your booking request was not completed before the reservation hold period ended, so it has now been declined automatically.",
      outroText:
        "We understand this may be disappointing. If you would still like to reserve a vehicle, please contact us and we will gladly help you arrange a new booking as quickly as possible.",
    };
  }

  return {
    subject: "We’re Sorry, We’re Unable to Approve Your Booking",
    title: "We’re sorry, we’re unable to approve your booking",
    introText:
      "We sincerely apologize, but we’re unable to approve your booking request at this time.",
    outroText: trimmedReason
      ? `Reason provided: ${trimmedReason} If you would like help finding another option or making a new reservation, please contact us and our team will be happy to assist.`
      : "If you would like help finding another option or making a new reservation, please contact us and our team will be happy to assist.",
  };
}

type InspectionStageValue = "PICKUP" | "RETURN";

type BookingInspectionInput = {
  odometerKm: number;
  fuelLevel: number;
  hasDamage: boolean;
  damageNotes?: string;
  agentNotes?: string;
  acceptedBy: string;
  imageUrls: string[];
  damageChargeCents?: number;
};

async function replaceInspectionPhotos(tx: typeof db, bookingId: string, stage: InspectionStageValue, imageUrls: string[]) {
  await tx.$executeRaw`DELETE FROM "BookingInspectionPhoto" WHERE "bookingId" = ${bookingId} AND "stage" = ${stage}::"InspectionStage"`;
  for (const imageUrl of imageUrls) {
    await tx.$executeRaw`
      INSERT INTO "BookingInspectionPhoto" (id, "bookingId", "stage", "imageUrl")
      VALUES (${crypto.randomUUID()}, ${bookingId}, ${stage}::"InspectionStage", ${imageUrl})
    `;
  }
}

async function ensureBookingOperationalColumns(client: typeof db = db) {
  await client.$executeRawUnsafe(`
    ALTER TABLE "Booking"
    ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP NULL
  `);
  await client.$executeRawUnsafe(`
    ALTER TABLE "Booking"
    ADD COLUMN IF NOT EXISTS "returnedAt" TIMESTAMP NULL
  `);
}

async function getBookingOperationalState(client: typeof db, bookingId: string) {
  const rows = await client.$queryRaw<Array<{ deliveredAt: Date | null; returnedAt: Date | null }>>`
    SELECT "deliveredAt", "returnedAt"
    FROM "Booking"
    WHERE id = ${bookingId}
    LIMIT 1
  `;
  return rows[0] || { deliveredAt: null, returnedAt: null };
}

async function loadBookingAdjustments(bookingId: string) {
  let extras: Array<{
    id: string;
    extraId: string;
    quantity: number;
    lineTotal: number;
    extraName: string;
    pricingType: "DAILY" | "FLAT";
    amount: number;
  }> = [];
  let discount: { id: string; percentage: number; amount: number; code: string } | null = null;

  try {
    extras = await db.$queryRaw<Array<{
      id: string;
      extraId: string;
      quantity: number;
      lineTotal: number;
      extraName: string;
      pricingType: "DAILY" | "FLAT";
      amount: number;
    }>>`
      SELECT be.id, be."extraId" as "extraId", be.quantity, be."lineTotal", e.name as "extraName", e."pricingType", e.amount
      FROM "BookingExtra" be
      JOIN "Extra" e ON e.id = be."extraId"
      WHERE be."bookingId" = ${bookingId}
      ORDER BY be."createdAt" ASC
    `;
  } catch {
    extras = [];
  }

  try {
    const rows = await db.$queryRaw<Array<{ id: string; percentage: number; amount: number; code: string }>>`
      SELECT bd.id, bd.percentage, bd.amount, dc.code
      FROM "BookingDiscount" bd
      JOIN "DiscountCode" dc ON dc.id = bd."discountCodeId"
      WHERE bd."bookingId" = ${bookingId}
      LIMIT 1
    `;
    discount = rows[0] || null;
  } catch {
    discount = null;
  }

  return { extras, discount };
}

function isPrivilegedAdminRole(role: string | null | undefined) {
  return role === "ROOT" || role === "OWNER";
}

async function resolveActiveLocation(locationId: string | null | undefined) {
  if (!locationId) return null;
  return db.location.findUnique({
    where: { id: locationId },
    select: { id: true, name: true },
  });
}

async function evaluateBookingPricingRules(params: {
  startDate: Date;
  endDate: Date;
  basePriceCents: number;
  extrasCents: number;
  taxPercentage: number;
  baseRentalIncludesTax: boolean;
  bookingSource: "public" | "admin";
}) {
  const settings = await getBookingRuleSettings();
  const evaluation = evaluateBookingRules({
    startDate: params.startDate,
    endDate: params.endDate,
    basePriceCents: params.basePriceCents,
    extrasCents: params.extrasCents,
    taxPercentage: params.taxPercentage,
    baseRentalIncludesTax: params.baseRentalIncludesTax,
    bookingSource: params.bookingSource,
    settings,
  });

  if (evaluation.belowMinimumBlocked) {
    return {
      ok: false as const,
      error: `This booking is below the ${settings.minimumRentalDays}-day minimum and can only be created by an admin.`,
    };
  }

  if (evaluation.lastMinuteBlocked) {
    return {
      ok: false as const,
      error: `This booking starts within ${settings.lastMinuteBookingThresholdHours} hour(s) and can only be created by an admin.`,
    };
  }

  return {
    ok: true as const,
    evaluation,
  };
}

async function selectAvailableVehicleForBooking(params: {
  tx: typeof db;
  bookingIdToExclude?: string;
  categoryId: string;
  startDate: Date;
  endDate: Date;
  preferredVehicleId?: string | null;
  specificVehicleId?: string | null;
}) {
  const { tx, bookingIdToExclude, categoryId, startDate, endDate, preferredVehicleId, specificVehicleId } = params;
  const vehicleRows = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT v.id
    FROM "Vehicle" v
    WHERE v."categoryId" = ${categoryId}
      AND (v."status" = 'ACTIVE' OR v.id = ${preferredVehicleId || ""})
      AND (${specificVehicleId || null}::text IS NULL OR v.id = ${specificVehicleId || null})
      AND NOT EXISTS (
        SELECT 1
        FROM "Booking" b
        WHERE b."vehicleId" = v.id
          AND b.id <> ${bookingIdToExclude || ""}
          AND b."startDate" < ${endDate}
          AND b."endDate" > ${startDate}
          AND (
            b."status" = 'CONFIRMED'
            OR (b."status" = 'PENDING' AND b."holdExpiresAt" > now())
          )
      )
      AND NOT EXISTS (
        SELECT 1
        FROM "VehicleBlockout" vb
        WHERE (vb."vehicleId" IS NULL OR vb."vehicleId" = v.id)
          AND vb."startDate" < ${endDate}
          AND vb."endDate" > ${startDate}
      )
    ORDER BY CASE WHEN v.id = ${preferredVehicleId || ""} THEN 0 ELSE 1 END, v.name ASC
    LIMIT 1
  `;
  return vehicleRows[0]?.id || null;
}

export async function cancelExpiredHolds() {
  const expiredBookings = await db.booking.findMany({
    where: {
      status: "PENDING",
      holdExpiresAt: {
        lt: new Date(),
      },
    },
    select: {
      id: true,
      customerEmail: true,
      customerName: true,
      bookingCode: true,
      startDate: true,
      endDate: true,
      totalAmount: true,
    },
  });

  if (expiredBookings.length === 0) return 0;

  await db.booking.updateMany({
    where: {
      id: {
        in: expiredBookings.map((booking) => booking.id),
      },
    },
    data: {
      status: "DECLINED",
      notes: "Booking automatically declined after the hold period expired.",
    },
  });

  await Promise.all(
    expiredBookings.map(async (booking) => {
      try {
        const emailContent = buildDeclineEmailContent({ automatic: true });
        await sendEmail({
          to: booking.customerEmail,
          subject: `${emailContent.subject} - ${booking.bookingCode}`,
          html: await bookingEmailHtml({
            title: emailContent.title,
            customerName: booking.customerName,
            bookingCode: booking.bookingCode,
            startDate: booking.startDate,
            endDate: booking.endDate,
            totalAmountCents: booking.totalAmount,
            introText: emailContent.introText,
            outroText: emailContent.outroText,
          }),
        });
      } catch {}
    })
  );

  return expiredBookings.length;
}

export async function confirmBookingAction(bookingId: string, locale: string) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    // Check license (allow if ACTIVE or ROOT)
    if (!isLicenseActive() && session.role !== "ROOT") {
      return { success: false, error: "BOOKING_DISABLED" };
    }

    const existing = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        customerEmail: true,
        customerName: true,
        bookingCode: true,
        startDate: true,
        endDate: true,
        totalAmount: true,
      },
    });
    if (!existing) return { success: false, error: "Booking not found" };
    if (existing.status === "CONFIRMED") return { success: false, error: "BOOKING_ALREADY_CONFIRMED" };
    if (existing.status !== "PENDING") return { success: false, error: "BOOKING_NOT_CONFIRMABLE" };

    const booking = await db.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED" },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        adminUserId: session.adminUserId,
        action: "BOOKING_CONFIRMED",
        bookingId,
      },
    });

    try {
      const rentalAgreement = await buildAndUploadBookingDocument(bookingId, "RENTAL_AGREEMENT");
      const termsEmailData = await getCustomerTermsEmailData();
      await sendEmail({
        to: booking.customerEmail,
        subject: `Booking Confirmed - ${booking.bookingCode}`,
        html: await bookingEmailHtml({
          title: "Your booking has been confirmed",
          customerName: booking.customerName,
          bookingCode: booking.bookingCode,
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalAmountCents: booking.totalAmount,
          termsUrl: termsEmailData.termsUrl,
        }),
        attachments: [
          ...(rentalAgreement.success && rentalAgreement.pdfBuffer
            ? [
                {
                  filename: rentalAgreement.filename,
                  content: rentalAgreement.pdfBuffer,
                  contentType: "application/pdf",
                },
              ]
            : []),
          ...termsEmailData.attachments,
        ],
      });
    } catch {}

    return { success: true, booking };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to confirm booking" };
  }
}

export async function declineBookingAction(
  bookingId: string,
  reason: string,
  locale: string
) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    // Check license
    if (!isLicenseActive() && session.role !== "ROOT") {
      return { success: false, error: "BOOKING_DISABLED" };
    }

    const booking = await db.booking.update({
      where: { id: bookingId },
      data: {
        status: "DECLINED",
        notes: reason,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        adminUserId: session.adminUserId,
        action: "BOOKING_DECLINED",
        bookingId,
      },
    });

    try {
      const emailContent = buildDeclineEmailContent({ reason });
      await sendEmail({
        to: booking.customerEmail,
        subject: `${emailContent.subject} - ${booking.bookingCode}`,
        html: await bookingEmailHtml({
          title: emailContent.title,
          customerName: booking.customerName,
          bookingCode: booking.bookingCode,
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalAmountCents: booking.totalAmount,
          introText: emailContent.introText,
          outroText: emailContent.outroText,
        }),
      });
    } catch {}

    return { success: true, booking };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to decline booking" };
  }
}

export async function addBookingNoteAction(
  bookingId: string,
  note: string,
  locale: string
) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const booking = await db.booking.update({
      where: { id: bookingId },
      data: {
        notes: note,
      },
    });
    await logAdminAction({
      adminUserId: session.adminUserId,
      action: "BOOKING_NOTE_UPDATED",
      bookingId,
    });

    return { success: true, booking };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to add note" };
  }
}

async function buildAndUploadBookingDocument(
  bookingId: string,
  documentType: BookingDocumentType
) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      vehicle: true,
      category: true,
      pickupLocationRef: true,
      dropoffLocationRef: true,
    },
  });

  if (!booking) {
    return { success: false as const, error: "Booking not found" };
  }
  if (!booking.vehicleId || !booking.vehicle) {
    return { success: false as const, error: "No vehicle assigned to booking" };
  }
  if (booking.status === "DECLINED" || booking.status === "CANCELLED") {
    return { success: false as const, error: "Cannot invoice declined/cancelled booking" };
  }

  const { extras: adjustmentExtras, discount: bookingDiscount } = await loadBookingAdjustments(bookingId);
  const rentalDays = Math.max(1, Math.ceil((booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const baseRental = booking.category.dailyRate * rentalDays;
  const extrasTotal = adjustmentExtras.reduce((sum, line) => sum + line.lineTotal, 0);
  const discountAmount = bookingDiscount ? Math.round((baseRental * bookingDiscount.percentage) / 100) : 0;
  const [taxPercentage, vehicleRatesIncludeTax] = await Promise.all([
    getTaxPercentage(),
    getVehicleRatesIncludeTax(),
  ]);
  const { taxAmount, totalAmount } = calculateBookingAmounts({
    baseRentalCents: baseRental,
    extrasCents: extrasTotal,
    discountCents: discountAmount,
    taxPercentage,
    baseRentalIncludesTax: vehicleRatesIncludeTax,
  });

  const invoiceBuffer = await generateInvoicePDF({
    documentType,
    orderId: booking.id,
    bookingCode: booking.bookingCode,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    customerPhone: booking.customerPhone,
    vehicleName: booking.vehicle.name || "-",
    categoryName: booking.category.name,
    pickupLocation: booking.pickupLocationRef?.name || booking.pickupLocation || "-",
    dropoffLocation: booking.dropoffLocationRef?.name || booking.dropoffLocation || "-",
    startDate: booking.startDate,
    endDate: booking.endDate,
    baseRentalAmount: baseRental,
    extrasAmount: extrasTotal,
    discountAmount,
    taxAmount,
    taxPercentage,
    totalAmount: totalAmount + (booking.returnLateCharge || 0) + (booking.returnFuelCharge || 0) + (booking.returnDamageCharge || 0),
    discountCode: bookingDiscount?.code,
    extras: adjustmentExtras.map((line) => ({
      name: line.extraName,
      quantity: line.quantity,
      lineTotal: line.lineTotal,
    })),
    paymentInstructions: (await getTenantConfig()).paymentInstructions,
    tenantConfig: await getTenantConfig(),
  });
  const signature = invoiceBuffer.subarray(0, 4).toString("utf8");
  if (signature !== "%PDF" || invoiceBuffer.length < 500) {
    return { success: false as const, error: "Generated PDF is invalid or empty" };
  }

  const uploadFolder =
    documentType === "RENTAL_AGREEMENT"
      ? "rental-agreements"
      : documentType === "SALES_RECEIPT"
        ? "sales-receipts"
        : "invoices";
  const filenamePrefix =
    documentType === "RENTAL_AGREEMENT"
      ? "rental-agreement"
      : documentType === "SALES_RECEIPT"
        ? "sales-receipt"
        : "invoice";
  const filename = `${filenamePrefix}-${booking.bookingCode}.pdf`;
  const uploadResult = await uploadBuffer(
    invoiceBuffer,
    uploadFolder,
    filename,
    "application/pdf"
  );
  if (!uploadResult.success || !uploadResult.url) {
    return { success: false as const, error: uploadResult.error || "Failed to upload document" };
  }

  return {
    success: true as const,
    booking,
    invoiceUrl: uploadResult.url,
    pdfBuffer: invoiceBuffer,
    filename,
    baseRentalAmount: baseRental,
    extrasAmount: extrasTotal,
    discountAmount,
    taxAmount,
    totalAmount: booking.totalAmount,
    extras: adjustmentExtras.map((line) => ({
      name: line.extraName,
      quantity: line.quantity,
      lineTotal: line.lineTotal,
    })),
  };
}

export async function sendInvoiceEstimateAction(bookingId: string, locale: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };
    if (!isLicenseActive() && session.role !== "ROOT") return { success: false, error: "BOOKING_DISABLED" };
    await ensureQuickBooksBookingColumns();

    const generated = await buildAndUploadBookingDocument(bookingId, "INVOICE");
    if (!generated.success) return { success: false, error: generated.error };

    const updated = await db.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          invoiceUrl: generated.invoiceUrl,
        },
      });
      await tx.auditLog.create({
        data: {
          adminUserId: session.adminUserId,
          action: "INVOICE_SENT_PAYMENT_REQUEST",
          bookingId,
        },
      });
      return updatedBooking;
    });
    const invoiceProvider = await markBookingBillingDocumentForActiveProvider(bookingId, "INVOICE");
    await logAdminAction({
      adminUserId: session.adminUserId,
      action: invoiceProvider === "ZOHO" ? "ZOHO_TRANSFER_QUEUED_INVOICE" : invoiceProvider === "QUICKBOOKS" ? "QUICKBOOKS_TRANSFER_QUEUED_INVOICE" : "BILLING_DOCUMENT_MARKED_INVOICE",
      bookingId,
    });

    try {
      const termsEmailData = await getCustomerTermsEmailData();
      await sendEmail({
        to: updated.customerEmail,
        subject: `Invoice for Payment - ${updated.bookingCode}`,
        html: await bookingEmailHtml({
          title: "Your invoice is ready for payment",
          customerName: updated.customerName,
          bookingCode: updated.bookingCode,
          startDate: updated.startDate,
          endDate: updated.endDate,
          totalAmountCents: updated.totalAmount,
          extras: generated.extras,
          invoiceUrl: generated.invoiceUrl,
          documentLabel: "Invoice",
          termsUrl: termsEmailData.termsUrl,
        }),
        attachments: [
          {
            filename: generated.filename,
            content: generated.pdfBuffer,
            contentType: "application/pdf",
          },
          ...termsEmailData.attachments,
        ],
      });
    } catch {}

    return { success: true, booking: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to send invoice" };
  }
}

export async function sendBillingDocumentEmailAction(bookingId: string, locale: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };
    if (!isLicenseActive() && session.role !== "ROOT") return { success: false, error: "BOOKING_DISABLED" };

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        bookingCode: true,
        customerName: true,
        customerEmail: true,
        startDate: true,
        endDate: true,
        totalAmount: true,
        invoiceUrl: true,
      },
    });

    if (!booking) return { success: false, error: "Booking not found" };
    if (!booking.invoiceUrl) return { success: false, error: "No billing document available" };

    const billingDocumentUrl = getBlobProxyUrl(booking.invoiceUrl, { download: true }) || booking.invoiceUrl;
    const { extras: adjustmentExtras } = await loadBookingAdjustments(bookingId);
    const termsEmailData = await getCustomerTermsEmailData();

    const mailResult = await sendEmail({
      to: booking.customerEmail,
      subject: `Billing Document - ${booking.bookingCode}`,
      html: await bookingEmailHtml({
        title: "Your billing document is ready",
        customerName: booking.customerName,
        bookingCode: booking.bookingCode,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalAmountCents: booking.totalAmount,
        extras: adjustmentExtras.map((line) => ({
          name: line.extraName,
          quantity: line.quantity,
          lineTotal: line.lineTotal,
        })),
        invoiceUrl: billingDocumentUrl,
        documentLabel: "Billing document",
        termsUrl: termsEmailData.termsUrl,
      }),
      attachments: termsEmailData.attachments,
    });

    if (!mailResult.success) {
      return { success: false, error: mailResult.error || "Failed to send billing document email" };
    }
    await logAdminAction({
      adminUserId: session.adminUserId,
      action: "BILLING_DOCUMENT_EMAIL_SENT",
      bookingId,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to send billing document email" };
  }
}

export async function createSalesReceiptAction(
  bookingId: string,
  locale: string,
  markDeliveredNow = false
) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };
    if (!isLicenseActive() && session.role !== "ROOT") return { success: false, error: "BOOKING_DISABLED" };
    await ensureBookingOperationalColumns();
    await ensureQuickBooksBookingColumns();

    const generated = await buildAndUploadBookingDocument(bookingId, "SALES_RECEIPT");
    if (!generated.success) return { success: false, error: generated.error };

    const updated = await db.$transaction(async (tx) => {
      const bookingCols = await tx.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Booking'
      `;
      const hasPaymentReceivedAt = bookingCols.some((c) => c.column_name === "paymentReceivedAt");
      const now = new Date();

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "CONFIRMED",
          invoiceUrl: generated.invoiceUrl,
          ...(hasPaymentReceivedAt ? ({ paymentReceivedAt: now } as any) : {}),
        } as any,
      });
      if (hasPaymentReceivedAt) {
        try {
          await tx.$executeRaw`
            UPDATE "Booking" SET "paymentReceivedAt" = COALESCE("paymentReceivedAt", ${now}) WHERE id = ${bookingId}
          `;
        } catch {}
      }
      if (markDeliveredNow) {
        await tx.$executeRaw`
          UPDATE "Booking"
          SET "deliveredAt" = COALESCE("deliveredAt", ${now})
          WHERE id = ${bookingId}
        `;
        await tx.vehicle.update({
          where: { id: generated.booking.vehicleId! },
          data: { status: "ON_RENT" },
        });
      }
      await tx.auditLog.create({
        data: {
          adminUserId: session.adminUserId,
          action: markDeliveredNow
            ? "SALES_RECEIPT_CREATED_PAYMENT_RECEIVED_DELIVERED"
            : "SALES_RECEIPT_CREATED_PAYMENT_RECEIVED",
          bookingId,
        },
      });
      return updatedBooking;
    });
    const invoiceProvider = await markBookingBillingDocumentForActiveProvider(bookingId, "SALES_RECEIPT");
    await logAdminAction({
      adminUserId: session.adminUserId,
      action: invoiceProvider === "ZOHO" ? "ZOHO_TRANSFER_QUEUED_SALES_RECEIPT" : invoiceProvider === "QUICKBOOKS" ? "QUICKBOOKS_TRANSFER_QUEUED_SALES_RECEIPT" : "BILLING_DOCUMENT_MARKED_SALES_RECEIPT",
      bookingId,
    });

    try {
      const termsEmailData = await getCustomerTermsEmailData();
      await sendEmail({
        to: updated.customerEmail,
        subject: `Sales Receipt - ${updated.bookingCode}`,
        html: await bookingEmailHtml({
          title: "Payment received. Your sales receipt is ready",
          customerName: updated.customerName,
          bookingCode: updated.bookingCode,
          startDate: updated.startDate,
          endDate: updated.endDate,
          totalAmountCents: updated.totalAmount,
          extras: generated.extras,
          invoiceUrl: generated.invoiceUrl,
          documentLabel: "Sales receipt",
          termsUrl: termsEmailData.termsUrl,
        }),
        attachments: [
          {
            filename: generated.filename,
            content: generated.pdfBuffer,
            contentType: "application/pdf",
          },
          ...termsEmailData.attachments,
        ],
      });
    } catch {}

    return { success: true, booking: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create sales receipt" };
  }
}

export async function receiveInvoicePaymentAction(bookingId: string, locale: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };
    if (!isLicenseActive() && session.role !== "ROOT") return { success: false, error: "BOOKING_DISABLED" };
    await ensureQuickBooksBookingColumns();

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        category: true,
      },
    });
    if (!booking) return { success: false, error: "Booking not found" };
    if (booking.status === "DECLINED" || booking.status === "CANCELLED") {
      return { success: false, error: "Cannot receive payment for declined/cancelled booking" };
    }
    if (!booking.invoiceUrl) return { success: false, error: "INVOICE_REQUIRED" };
    if (booking.paymentReceivedAt) return { success: true, booking };

    const updated = await db.$transaction(async (tx) => {
      const now = new Date();
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "CONFIRMED",
          paymentReceivedAt: now,
        },
      });
      await tx.auditLog.create({
        data: {
          adminUserId: session.adminUserId,
          action: "INVOICE_PAYMENT_RECEIVED_NO_SALES_RECEIPT",
          bookingId,
        },
      });
      return updatedBooking;
    });
    const invoiceProvider = await queuePaymentTransferForActiveProvider(bookingId);
    await logAdminAction({
      adminUserId: session.adminUserId,
      action: invoiceProvider === "ZOHO" ? "ZOHO_TRANSFER_QUEUED_PAYMENT" : invoiceProvider === "QUICKBOOKS" ? "QUICKBOOKS_TRANSFER_QUEUED_PAYMENT" : "PAYMENT_RECEIVED_NO_PROVIDER_QUEUE",
      bookingId,
    });

    try {
      const termsEmailData = await getCustomerTermsEmailData();
      await sendEmail({
        to: updated.customerEmail,
        subject: `Payment Received - ${updated.bookingCode}`,
        html: await bookingEmailHtml({
          title: "Payment received for your invoice",
          customerName: updated.customerName,
          bookingCode: updated.bookingCode,
          startDate: updated.startDate,
          endDate: updated.endDate,
          totalAmountCents: updated.totalAmount,
          extras: (await loadBookingAdjustments(bookingId)).extras.map((line) => ({
            name: line.extraName,
            quantity: line.quantity,
            lineTotal: line.lineTotal,
          })),
          invoiceUrl: updated.invoiceUrl,
          documentLabel: "Invoice",
          termsUrl: termsEmailData.termsUrl,
        }),
        attachments: termsEmailData.attachments,
      });
    } catch {}

    return { success: true, booking: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to mark invoice payment as received" };
  }
}

export async function uploadInspectionImageAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };
    if (!isLicenseActive() && session.role !== "ROOT") return { success: false, error: "BOOKING_DISABLED" };

    const file = formData.get("image") as File | null;
    if (!file || file.size === 0) {
      return { success: false, error: "No file provided" };
    }
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      return { success: false, error: "Only JPG and PNG files are allowed" };
    }

    const upload = await uploadFile(file, "inspections");
    if (!upload.success || !upload.url) {
      return { success: false, error: upload.error || "Failed to upload image" };
    }

    await logAdminAction({
      adminUserId: session.adminUserId,
      action: "BOOKING_INSPECTION_IMAGE_UPLOADED",
    });

    return { success: true, imageUrl: upload.url };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to upload inspection image" };
  }
}

export async function completePickupInspectionAction(
  bookingId: string,
  input: BookingInspectionInput,
  locale: string
) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };
    if (!isLicenseActive() && session.role !== "ROOT") return { success: false, error: "BOOKING_DISABLED" };
    await ensureBookingOperationalColumns();

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        vehicleId: true,
        paymentReceivedAt: true,
      },
    });
    if (!booking) return { success: false, error: "Booking not found" };
    if (booking.status !== "CONFIRMED") return { success: false, error: "BOOKING_NOT_DELIVERABLE" };
    if (!booking.paymentReceivedAt) return { success: false, error: "PAYMENT_REQUIRED_BEFORE_DELIVERY" };

    const operational = await getBookingOperationalState(db, bookingId);
    if (operational.deliveredAt) return { success: false, error: "BOOKING_ALREADY_DELIVERED" };

    await db.$transaction(async (tx) => {
      const now = new Date();
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          pickupOdometerKm: Math.max(0, Math.round(input.odometerKm)),
          pickupFuelLevel: Math.max(0, Math.min(4, Math.round(input.fuelLevel))),
          pickupHasDamage: Boolean(input.hasDamage),
          pickupDamageNotes: input.damageNotes?.trim() || null,
          pickupAcceptedBy: input.acceptedBy.trim(),
          pickupAcceptedAt: now,
          pickupAgentNotes: input.agentNotes?.trim() || null,
        } as any,
      });
      await tx.$executeRaw`
        UPDATE "Booking"
        SET "deliveredAt" = ${now}
        WHERE id = ${bookingId}
      `;
      if (booking.vehicleId) {
        await tx.vehicle.update({
          where: { id: booking.vehicleId },
          data: { status: "ON_RENT" },
        });
      }
      await replaceInspectionPhotos(tx as typeof db, bookingId, "PICKUP", input.imageUrls);
      await tx.auditLog.create({
        data: {
          adminUserId: session.adminUserId,
          action: "BOOKING_PICKUP_INSPECTION_COMPLETED",
          bookingId,
        },
      });
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to complete pickup inspection" };
  }
}

export async function completeReturnInspectionAction(
  bookingId: string,
  input: BookingInspectionInput,
  locale: string
) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };
    if (!isLicenseActive() && session.role !== "ROOT") return { success: false, error: "BOOKING_DISABLED" };
    await ensureBookingOperationalColumns();

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        vehicleId: true,
        endDate: true,
        pickupFuelLevel: true,
        totalAmount: true,
        category: {
          select: {
            id: true,
            name: true,
            dailyRate: true,
            fuelChargePerQuarter: true,
          },
        },
      },
    });
    if (!booking) return { success: false, error: "Booking not found" };
    if (booking.status !== "CONFIRMED") return { success: false, error: "BOOKING_NOT_RETURNABLE" };

    const operational = await getBookingOperationalState(db, bookingId);
    if (!operational.deliveredAt) return { success: false, error: "BOOKING_NOT_DELIVERED" };
    if (operational.returnedAt) return { success: false, error: "BOOKING_ALREADY_RETURNED" };

    const returnedAt = new Date();

    const fuelCharge = calculateFuelDifferenceCharge({
      pickupFuelLevel: booking.pickupFuelLevel,
      returnFuelLevel: input.fuelLevel,
      chargePerQuarterCents: getFuelChargePerQuarterForCategory(booking.category),
    }).chargeCents;
    const lateReturn = calculateLateReturnCharge({
      scheduledDropoffAt: booking.endDate,
      actualReturnedAt: returnedAt,
      dailyRateCents: booking.category?.dailyRate || 0,
    });
    const lateCharge = lateReturn.chargeCents;
    const damageCharge = Math.max(0, Math.round(input.damageChargeCents || 0));
    const totalAdjustment = lateCharge + fuelCharge + damageCharge;

    await db.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          returnOdometerKm: Math.max(0, Math.round(input.odometerKm)),
          returnFuelLevel: Math.max(0, Math.min(4, Math.round(input.fuelLevel))),
          returnHasDamage: Boolean(input.hasDamage),
          returnDamageNotes: input.damageNotes?.trim() || null,
          returnAcceptedBy: input.acceptedBy.trim(),
          returnAcceptedAt: returnedAt,
          returnAgentNotes: input.agentNotes?.trim() || null,
          returnLateCharge: lateCharge,
          returnFuelCharge: fuelCharge,
          returnDamageCharge: damageCharge,
          totalAmount: booking.totalAmount + totalAdjustment,
          returnedAt: returnedAt,
        } as any,
      });
      if (booking.vehicleId) {
        await tx.vehicle.update({
          where: { id: booking.vehicleId },
          data: { status: "ACTIVE" },
        });
      }
      await replaceInspectionPhotos(tx as typeof db, bookingId, "RETURN", input.imageUrls);
      await tx.auditLog.create({
        data: {
          adminUserId: session.adminUserId,
          action: "BOOKING_RETURN_INSPECTION_COMPLETED",
          bookingId,
        },
      });
    });

    return { success: true, lateCharge, lateDays: lateReturn.lateDays, fuelCharge, damageCharge, totalAdjustment };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to complete return inspection" };
  }
}

export async function markBookingDeliveredAction(bookingId: string, locale: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };
    if (!isLicenseActive() && session.role !== "ROOT") return { success: false, error: "BOOKING_DISABLED" };
    await ensureBookingOperationalColumns();

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        vehicleId: true,
        paymentReceivedAt: true,
      },
    });
    if (!booking) return { success: false, error: "Booking not found" };
    if (booking.status !== "CONFIRMED") return { success: false, error: "BOOKING_NOT_DELIVERABLE" };
    if (!booking.paymentReceivedAt) return { success: false, error: "PAYMENT_REQUIRED_BEFORE_DELIVERY" };

    const operational = await getBookingOperationalState(db, bookingId);
    if (operational.deliveredAt) return { success: false, error: "BOOKING_ALREADY_DELIVERED" };

    await db.$transaction(async (tx) => {
      const now = new Date();
      await tx.$executeRaw`
        UPDATE "Booking"
        SET "deliveredAt" = ${now}
        WHERE id = ${bookingId}
      `;
      if (booking.vehicleId) {
        await tx.vehicle.update({
          where: { id: booking.vehicleId },
          data: { status: "ON_RENT" },
        });
      }
      await tx.auditLog.create({
        data: {
          adminUserId: session.adminUserId,
          action: "BOOKING_MARKED_DELIVERED",
          bookingId,
        },
      });
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to mark booking as delivered" };
  }
}

export async function markBookingReturnedAction(bookingId: string, locale: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };
    if (!isLicenseActive() && session.role !== "ROOT") return { success: false, error: "BOOKING_DISABLED" };
    await ensureBookingOperationalColumns();

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        vehicleId: true,
      },
    });
    if (!booking) return { success: false, error: "Booking not found" };
    if (booking.status !== "CONFIRMED") return { success: false, error: "BOOKING_NOT_RETURNABLE" };

    const operational = await getBookingOperationalState(db, bookingId);
    if (!operational.deliveredAt) return { success: false, error: "BOOKING_NOT_DELIVERED" };
    if (operational.returnedAt) return { success: false, error: "BOOKING_ALREADY_RETURNED" };

    await db.$transaction(async (tx) => {
      const now = new Date();
      await tx.$executeRaw`
        UPDATE "Booking"
        SET "returnedAt" = ${now}
        WHERE id = ${bookingId}
      `;
      if (booking.vehicleId) {
        await tx.vehicle.update({
          where: { id: booking.vehicleId },
          data: { status: "ACTIVE" },
        });
      }
      await tx.auditLog.create({
        data: {
          adminUserId: session.adminUserId,
          action: "BOOKING_MARKED_RETURNED",
          bookingId,
        },
      });
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to mark booking as returned" };
  }
}

export async function generateInvoiceAction(bookingId: string, locale: string) {
  return createSalesReceiptAction(bookingId, locale);
}

async function recomputeBookingTotals(bookingId: string) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { category: true },
  });
  if (!booking) throw new Error("Booking not found");

  const { extras: adjustmentExtras, discount: bookingDiscount } = await loadBookingAdjustments(bookingId);
  const days = Math.max(1, Math.ceil((booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const baseRental = booking.category.dailyRate * days;
  const extrasTotal = adjustmentExtras.reduce((sum, line) => sum + line.lineTotal, 0);
  const percentage = bookingDiscount?.percentage ?? 0;
  const discountAmount = Math.round((baseRental * percentage) / 100);
  const [taxPercentage, vehicleRatesIncludeTax] = await Promise.all([
    getTaxPercentage(),
    getVehicleRatesIncludeTax(),
  ]);
  const { taxAmount, totalAmount } = calculateBookingAmounts({
    baseRentalCents: baseRental,
    extrasCents: extrasTotal,
    discountCents: discountAmount,
    taxPercentage,
    baseRentalIncludesTax: vehicleRatesIncludeTax,
  });

  await db.booking.update({ where: { id: bookingId }, data: { totalAmount } });
  if (bookingDiscount) {
    if ((db as any).bookingDiscount && typeof (db as any).bookingDiscount.update === "function") {
      await (db as any).bookingDiscount.update({
        where: { id: bookingDiscount.id },
        data: { amount: discountAmount },
      });
    } else {
      await db.$executeRaw`
        UPDATE "BookingDiscount"
        SET amount = ${discountAmount}
        WHERE id = ${bookingDiscount.id}
      `;
    }
  }

  return { booking, baseRental, extrasTotal, discountAmount, taxAmount, totalAmount };
}

export async function applyDiscountCodeToBookingAction(bookingId: string, code: string, locale: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };
    if (!isLicenseActive() && session.role !== "ROOT") return { success: false, error: "BOOKING_DISABLED" };

    const normalized = String(code || "").trim().toUpperCase();
    const discount = await db.discountCode.findUnique({ where: { code: normalized } });
    if (!discount || !discount.isActive) return { success: false, error: "Invalid discount code" };
    if (discount.expiresAt && discount.expiresAt < new Date()) return { success: false, error: "Discount code expired" };
    if (discount.maxUses && discount.usedCount >= discount.maxUses) return { success: false, error: "Discount code usage exceeded" };

    const existing = await db.bookingDiscount.findUnique({ where: { bookingId } });
    await db.$transaction(async (tx) => {
      if (existing) {
        await tx.bookingDiscount.update({
          where: { bookingId },
          data: { discountCodeId: discount.id, percentage: discount.percentage },
        });
      } else {
        await tx.bookingDiscount.create({
          data: {
            bookingId,
            discountCodeId: discount.id,
            percentage: discount.percentage,
            amount: 0,
          },
        });
        await tx.discountCode.update({ where: { id: discount.id }, data: { usedCount: { increment: 1 } } });
      }
    });

    await recomputeBookingTotals(bookingId);
    const invoiceResult = await sendInvoiceEstimateAction(bookingId, locale);
    if (!invoiceResult.success) return { success: false, error: invoiceResult.error || "Discount applied but invoice update failed" };
    await logAdminAction({
      adminUserId: session.adminUserId,
      action: "BOOKING_DISCOUNT_APPLIED",
      bookingId,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to apply discount" };
  }
}

export async function addExtraToBookingAction(bookingId: string, extraId: string, quantity: number, locale: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };
    if (!isLicenseActive() && session.role !== "ROOT") return { success: false, error: "BOOKING_DISABLED" };

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { category: true, bookingExtras: true },
    });
    if (!booking) return { success: false, error: "Booking not found" };
    const extra = await db.extra.findUnique({ where: { id: extraId } });
    if (!extra || !extra.isActive) return { success: false, error: "Extra not available" };

    const days = Math.max(1, Math.ceil((booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const qty = Math.max(1, Math.round(quantity || 1));
    const lineTotal = extra.pricingType === "DAILY" ? extra.amount * days * qty : extra.amount * qty;

    await db.bookingExtra.upsert({
      where: { bookingId_extraId: { bookingId, extraId } },
      update: { quantity: qty, lineTotal },
      create: { bookingId, extraId, quantity: qty, lineTotal },
    });

    await recomputeBookingTotals(bookingId);
    const invoiceResult = await sendInvoiceEstimateAction(bookingId, locale);
    if (!invoiceResult.success) return { success: false, error: invoiceResult.error || "Extra added but invoice update failed" };
    await logAdminAction({
      adminUserId: session.adminUserId,
      action: "BOOKING_EXTRA_ADDED",
      bookingId,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to add extra" };
  }
}

export async function uploadDriverLicenseAction(formData: FormData) {
  try {
    const driverLicenseFile = formData.get("driverLicense") as File | null;

    if (!driverLicenseFile || driverLicenseFile.size === 0) {
      return { success: false, error: "No file provided" };
    }

    // Validate file type and size
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowedTypes.includes(driverLicenseFile.type)) {
      return { success: false, error: "Invalid file type. Only JPG, PNG, and PDF are allowed." };
    }

    if (driverLicenseFile.size > 8 * 1024 * 1024) { // 8MB
      return { success: false, error: "File size must not exceed 8MB" };
    }

    const uploadResult = await uploadFile(driverLicenseFile, "licenses");
    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error || "Upload failed" };
    }

    return { success: true, driverLicenseUrl: uploadResult.url };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to upload driver license" };
  }
}

export async function createCategoryBookingAction(
  formData: FormData,
  locale: string
) {
  try {
    // Cancel expired holds first
    await cancelExpiredHolds();

    // Check license
    const session = await getSession();
    if (!isLicenseActive() && session?.role !== "ROOT") {
      return { success: false, error: "BOOKING_DISABLED" };
    }

    // Extract form fields
    const categoryId = formData.get("categoryId") as string;
    const customerName = formData.get("customerName") as string;
    const customerEmail = formData.get("customerEmail") as string;
    const customerPhone = formData.get("customerPhone") as string;
    const flightNumber = ((formData.get("flightNumber") as string | null) || "").trim();
    const birthDate = parseKralendijkDate(String(formData.get("birthDate") || ""));
    const driverLicenseNumber = formData.get("driverLicenseNumber") as string;
    const licenseExpiryDate = parseKralendijkDate(String(formData.get("licenseExpiryDate") || ""), true);
    const startDate = parseKralendijkDateTime(String(formData.get("startDate") || ""));
    const endDate = parseKralendijkDateTime(String(formData.get("endDate") || ""));
    const pickupLocationId = (formData.get("pickupLocationId") as string | null) || null;
    const dropoffLocationId = (formData.get("dropoffLocationId") as string | null) || null;
    const pickupLocation = (formData.get("pickupLocation") as string | null) || null;
    const dropoffLocation = (formData.get("dropoffLocation") as string | null) || null;
    const notes = formData.get("notes") as string | null;
    const extrasPayload = (formData.get("selectedExtras") as string | null) || "[]";
    const driverLicenseUrl = formData.get("driverLicenseUrl") as string;
    const bookingSource = (formData.get("bookingSource") as string | null) || "public";
    const privacyConsentAccepted = formData.get("privacyConsentAccepted") === "true";
    const termsAccepted = formData.get("termsAccepted") === "true";

    if (bookingSource === "admin") {
      if (!session || !isPrivilegedAdminRole(session.role)) {
        return { success: false, error: "Unauthorized" };
      }
    }

    // Basic validation
    if (
      !categoryId ||
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !formData.get("birthDate") ||
      !driverLicenseNumber ||
      !formData.get("licenseExpiryDate") ||
      !driverLicenseUrl ||
      !pickupLocationId ||
      !dropoffLocationId
    ) {
      return { success: false, error: "Missing required fields" };
    }

    if (!privacyConsentAccepted) {
      return { success: false, error: "Privacy consent must be accepted" };
    }

    if (!termsAccepted) {
      return { success: false, error: "Terms must be accepted" };
    }

    if (!birthDate || !licenseExpiryDate || !startDate || !endDate) {
      return { success: false, error: "Invalid booking date values" };
    }

    if (startDate >= endDate) {
      return { success: false, error: "Invalid date range" };
    }

    const validated = await categoryBookingFormSchemaRefined.parseAsync({
      categoryId,
      customerName,
      customerEmail,
      customerPhone,
      flightNumber: flightNumber || undefined,
      birthDate,
      driverLicenseNumber,
      licenseExpiryDate,
      startDate,
      endDate,
      pickupLocationId: pickupLocationId || undefined,
      dropoffLocationId: dropoffLocationId || undefined,
      pickupLocation: pickupLocation || undefined,
      dropoffLocation: dropoffLocation || undefined,
      driverLicenseUrl,
      privacyConsentAccepted,
      termsAccepted,
      notes: notes || undefined,
    });
    let selectedExtras: Array<{ extraId: string; quantity: number }> = [];
    try {
      const parsed = JSON.parse(extrasPayload);
      if (Array.isArray(parsed)) {
        selectedExtras = parsed
          .map((entry: any) => ({
            extraId: String(entry?.extraId || ""),
            quantity: Math.max(1, Number(entry?.quantity || 1)),
          }))
          .filter((entry) => entry.extraId.length > 0);
      }
    } catch {
      selectedExtras = [];
    }

    // Resolve locations by ID (if sent)
    const [pickupLocationRecord, dropoffLocationRecord] = await Promise.all([
      pickupLocationId
        ? db.location.findUnique({ where: { id: pickupLocationId }, select: { id: true, name: true } })
        : Promise.resolve(null),
      dropoffLocationId
        ? db.location.findUnique({ where: { id: dropoffLocationId }, select: { id: true, name: true } })
        : Promise.resolve(null),
    ]);

    if (pickupLocationId && !pickupLocationRecord) {
      return { success: false, error: "Invalid pickup location" };
    }

    if (dropoffLocationId && !dropoffLocationRecord) {
      return { success: false, error: "Invalid dropoff location" };
    }

    // Verify category exists and is active
    const category = await db.vehicleCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category || !category.isActive) {
      return { success: false, error: "CATEGORY_UNAVAILABLE" };
    }

    // Calculate days and total
    const days = Math.ceil((validated.endDate.getTime() - validated.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const baseTotal = category.dailyRate * Math.max(1, days);
    let extrasTotal = 0;
    let resolvedExtras: Array<{ extraId: string; quantity: number; lineTotal: number }> = [];
    if (selectedExtras.length > 0) {
      if ((db as any).extra && typeof (db as any).extra.findMany === "function") {
        const extraRows: Array<{ id: string; pricingType: "DAILY" | "FLAT"; amount: number }> = await (db as any).extra.findMany({
          where: { id: { in: selectedExtras.map((entry) => entry.extraId) }, isActive: true },
          select: { id: true, pricingType: true, amount: true },
        });
        const extraMap = new Map<string, { id: string; pricingType: "DAILY" | "FLAT"; amount: number }>(
          extraRows.map((row) => [row.id, row])
        );
        resolvedExtras = selectedExtras
          .map((entry) => {
            const extra = extraMap.get(entry.extraId);
            if (!extra) return null;
            const lineTotal = extra.pricingType === "DAILY" ? extra.amount * Math.max(1, days) * entry.quantity : extra.amount * entry.quantity;
            return { extraId: entry.extraId, quantity: entry.quantity, lineTotal };
          })
          .filter(Boolean) as Array<{ extraId: string; quantity: number; lineTotal: number }>;
      } else {
        const ids = selectedExtras.map((entry) => entry.extraId).filter(Boolean);
        const extraRows =
          ids.length > 0
            ? await db.$queryRawUnsafe<Array<{ id: string; pricingType: "DAILY" | "FLAT"; amount: number }>>(
                `SELECT id, "pricingType", amount
                 FROM "Extra"
                 WHERE "isActive" = true
                   AND id IN (${ids.map((_, i) => `$${i + 1}`).join(",")})`,
                ...ids
              )
            : [];
        const extraMap = new Map(extraRows.map((row) => [row.id, row]));
        resolvedExtras = selectedExtras
          .map((entry) => {
            const extra = extraMap.get(entry.extraId);
            if (!extra) return null;
            const lineTotal = extra.pricingType === "DAILY" ? extra.amount * Math.max(1, days) * entry.quantity : extra.amount * entry.quantity;
            return { extraId: entry.extraId, quantity: entry.quantity, lineTotal };
          })
          .filter(Boolean) as Array<{ extraId: string; quantity: number; lineTotal: number }>;
      }
      extrasTotal = resolvedExtras.reduce((sum, line) => sum + line.lineTotal, 0);
    }
    const [taxPercentage, vehicleRatesIncludeTax] = await Promise.all([
      getTaxPercentage(),
      getVehicleRatesIncludeTax(),
    ]);
    const pricingRules = await evaluateBookingPricingRules({
      startDate: validated.startDate,
      endDate: validated.endDate,
      basePriceCents: category.dailyRate,
      extrasCents: extrasTotal,
      taxPercentage,
      baseRentalIncludesTax: vehicleRatesIncludeTax,
      bookingSource: bookingSource === "admin" ? "admin" : "public",
    });
    if (!pricingRules.ok) {
      return { success: false, error: pricingRules.error };
    }
    const totalAmount = pricingRules.evaluation.totalAmountCents;


    // Database transaction to allocate vehicle
    let booking;
    try {
      const driverLicenseDeleteAfter = calculateDriverLicenseDeleteAfter(validated.endDate);
      booking = await db.$transaction(async (tx) =>  {
        await ensureVehicleBlockoutsTable(tx as typeof db);
        // Find available vehicle in category for the date range
        const availableVehicleRows = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT v.id
          FROM "Vehicle" v
          WHERE v."categoryId" = ${categoryId}
            AND v."status" = 'ACTIVE'
            AND NOT EXISTS (
              SELECT 1
              FROM "Booking" b
              WHERE b."vehicleId" = v.id
                AND b."startDate" < ${validated.endDate}
                AND b."endDate" > ${validated.startDate}
                AND (
                  b."status" = 'CONFIRMED'
                  OR (b."status" = 'PENDING' AND b."holdExpiresAt" > now())
                )
            )
            AND NOT EXISTS (
              SELECT 1
              FROM "VehicleBlockout" vb
              WHERE (vb."vehicleId" IS NULL OR vb."vehicleId" = v.id)
                AND vb."startDate" < ${validated.endDate}
                AND vb."endDate" > ${validated.startDate}
            )
          ORDER BY v.name ASC
          LIMIT 1
        `;
        const availableVehicle = availableVehicleRows[0]
          ? await tx.vehicle.findUnique({ where: { id: availableVehicleRows[0].id } })
          : null;

        if (!availableVehicle) {
          throw new Error("CATEGORY_UNAVAILABLE");
        }

        // Generate unique booking code
        let bookingCode: string;
        let attempts = 0;
        do {
          bookingCode = Math.random().toString(36).substring(2, 10).toUpperCase();
          attempts++;
          if (attempts > 10) throw new Error("Failed to generate unique booking code");
        } while (await tx.booking.findUnique({ where: { bookingCode } }));

        const bookingHoldDays = await getBookingHoldDays();

        const baseData = {
          categoryId,
          vehicleId: availableVehicle.id,
          customerName: validated.customerName,
          customerEmail: validated.customerEmail,
          customerPhone: validated.customerPhone,
          flightNumber: validated.flightNumber || null,
          driverLicenseNumber: validated.driverLicenseNumber,
          startDate: validated.startDate,
          endDate: validated.endDate,
          pickupLocationId: pickupLocationRecord?.id ?? null,
          dropoffLocationId: dropoffLocationRecord?.id ?? null,
          pickupLocation: pickupLocationRecord?.name ?? pickupLocation,
          dropoffLocation: dropoffLocationRecord?.name ?? dropoffLocation,
          totalAmount,
          status: "PENDING" as const,
          bookingCode,
          holdExpiresAt: new Date(Date.now() + bookingHoldDays * 24 * 60 * 60 * 1000),
          driverLicenseUrl,
          termsAcceptedAt: new Date(),
          notes: validated.notes,
        };

        let created: any;
        try {
          created = await tx.booking.create({
            data: {
              ...baseData,
              birthDate: validated.birthDate,
              licenseExpiryDate: validated.licenseExpiryDate,
            } as any,
          });
        } catch (createError: any) {
          const message = String(createError?.message || "");
          if (
            !message.includes("Unknown argument `birthDate`") &&
            !message.includes("Unknown argument `licenseExpiryDate`") &&
            !message.includes("Unknown argument `flightNumber`")
          ) {
            throw createError;
          }

          // Fallback for stale Prisma client: create with known fields, then patch dates in SQL.
          created = await tx.booking.create({ data: baseData as any });
          try {
            await tx.$executeRaw`
              UPDATE "Booking"
              SET
                "birthDate" = ${validated.birthDate},
                "licenseExpiryDate" = ${validated.licenseExpiryDate},
                "flightNumber" = ${validated.flightNumber || null}
              WHERE id = ${created.id}
            `;
          } catch {
            throw new Error("BOOKING_FIELDS_NOT_SAVED");
          }
        }

        await tx.$executeRaw`
          UPDATE "Booking"
          SET "driverLicenseDeleteAfter" = ${driverLicenseDeleteAfter}
          WHERE id = ${created.id}
        `;

        const persisted = await tx.$queryRaw<Array<{ birthDate: Date | null; licenseExpiryDate: Date | null; driverLicenseDeleteAfter: Date | null }>>`
          SELECT "birthDate", "licenseExpiryDate", "driverLicenseDeleteAfter"
          FROM "Booking"
          WHERE id = ${created.id}
          LIMIT 1
        `;
        if (!persisted[0]?.birthDate || !persisted[0]?.licenseExpiryDate || !persisted[0]?.driverLicenseDeleteAfter) {
          throw new Error("BOOKING_FIELDS_NOT_SAVED");
        }
        if (resolvedExtras.length > 0) {
          if ((tx as any).bookingExtra && typeof (tx as any).bookingExtra.createMany === "function") {
            await (tx as any).bookingExtra.createMany({
              data: resolvedExtras.map((line) => ({
                bookingId: created.id,
                extraId: line.extraId,
                quantity: line.quantity,
                lineTotal: line.lineTotal,
              })),
            });
          } else {
            for (const line of resolvedExtras) {
              await tx.$executeRaw`
                INSERT INTO "BookingExtra" ("bookingId", "extraId", quantity, "lineTotal")
                VALUES (${created.id}, ${line.extraId}, ${line.quantity}, ${line.lineTotal})
              `;
            }
          }
        }

        return created;
      });
    } catch (error: any) {
      if (error.message === "CATEGORY_UNAVAILABLE") {
        return { success: false, error: "CATEGORY_UNAVAILABLE" };
      }
      if (error.message === "BOOKING_FIELDS_NOT_SAVED") {
        return { success: false, error: "Failed to persist birth date/license expiry date" };
      }
      throw error;
    }

    try {
      await createNotification({
        type: "BOOKING_CREATED",
        title: "New booking request received",
        message: `${booking.customerName} requested ${category.name} from ${formatDate(booking.startDate)} to ${formatDate(booking.endDate)}.`,
        href: `/${locale}/admin/bookings/${booking.id}`,
        severity: "INFO",
      });
    } catch {}

    try {
      const tenant = await getTenantConfig();
      const subject = `New Booking Created - ${booking.bookingCode}`;
      const createdExtras = await loadBookingAdjustments(booking.id);
      const termsEmailData = await getCustomerTermsEmailData();
      const customerHtml = await bookingEmailHtml({
        title: "Booking request received",
        customerName: booking.customerName,
        bookingCode: booking.bookingCode,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalAmountCents: booking.totalAmount,
        extras: createdExtras.extras.map((line) => ({
          name: line.extraName,
          quantity: line.quantity,
          lineTotal: line.lineTotal,
        })),
        termsUrl: termsEmailData.termsUrl,
      });
      await sendEmail({
        to: booking.customerEmail,
        subject,
        html: customerHtml,
        attachments: termsEmailData.attachments,
      });
      await sendEmail({
        to: tenant.email,
        subject: `New Booking Alert - ${booking.bookingCode}`,
        html: customerHtml,
      });
    } catch {}

    return {
      success: true,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      redirectUrl:
        bookingSource === "admin"
          ? `/${locale}/admin/bookings/${booking.id}`
          : `/${locale}/book/success/${booking.bookingCode}`,
    };
  } catch (error: any) {
    console.error("Booking creation error:", error);
    return {
      success: false,
      error: error.message || "Failed to create booking",
    };
  }
}

export async function updateCategoryBookingAction(
  bookingId: string,
  formData: FormData,
  locale: string
) {
  try {
    const session = await getSession();
    if (!session || !isPrivilegedAdminRole(session.role)) {
      return { success: false, error: "Unauthorized" };
    }
    if (!isLicenseActive() && session.role !== "ROOT") {
      return { success: false, error: "BOOKING_DISABLED" };
    }

    const existing = await db.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        vehicleId: true,
        driverLicenseUrl: true,
        status: true,
      },
    });
    if (!existing) {
      return { success: false, error: "Booking not found" };
    }
    const operational = await getBookingOperationalState(db, bookingId);
    if (operational.returnedAt) {
      return { success: false, error: "Returned bookings cannot be edited" };
    }

    const categoryId = String(formData.get("categoryId") || "");
    const customerName = String(formData.get("customerName") || "");
    const customerEmail = String(formData.get("customerEmail") || "");
    const customerPhone = String(formData.get("customerPhone") || "");
    const flightNumber = String(formData.get("flightNumber") || "").trim();
    const birthDate = parseKralendijkDate(String(formData.get("birthDate") || ""));
    const driverLicenseNumber = String(formData.get("driverLicenseNumber") || "");
    const licenseExpiryDate = parseKralendijkDate(String(formData.get("licenseExpiryDate") || ""), true);
    const startDate = parseKralendijkDateTime(String(formData.get("startDate") || ""));
    const endDate = parseKralendijkDateTime(String(formData.get("endDate") || ""));
    const vehicleId = String(formData.get("vehicleId") || "").trim();
    const pickupLocationId = String(formData.get("pickupLocationId") || "");
    const dropoffLocationId = String(formData.get("dropoffLocationId") || "");
    const notes = String(formData.get("notes") || "");
    const extrasPayload = String(formData.get("selectedExtras") || "[]");

    if (!birthDate || !licenseExpiryDate || !startDate || !endDate) {
      return { success: false, error: "Invalid booking date values" };
    }

    const validated = await adminCategoryBookingUpdateSchemaRefined.parseAsync({
      categoryId,
      vehicleId: vehicleId || undefined,
      customerName,
      customerEmail,
      customerPhone,
      flightNumber: flightNumber || undefined,
      birthDate,
      driverLicenseNumber,
      licenseExpiryDate,
      startDate,
      endDate,
      pickupLocationId,
      dropoffLocationId,
      notes,
    });

    let selectedExtras: Array<{ extraId: string; quantity: number }> = [];
    try {
      const parsed = JSON.parse(extrasPayload);
      if (Array.isArray(parsed)) {
        selectedExtras = parsed
          .map((entry: any) => ({
            extraId: String(entry?.extraId || ""),
            quantity: Math.max(1, Number(entry?.quantity || 1)),
          }))
          .filter((entry) => entry.extraId.length > 0);
      }
    } catch {
      selectedExtras = [];
    }

    const [pickupLocationRecord, dropoffLocationRecord, category] = await Promise.all([
      resolveActiveLocation(validated.pickupLocationId),
      resolveActiveLocation(validated.dropoffLocationId),
      db.vehicleCategory.findUnique({ where: { id: validated.categoryId } }),
    ]);

    if (!pickupLocationRecord || !dropoffLocationRecord) {
      return { success: false, error: "Invalid pickup or dropoff location" };
    }
    if (!category || !category.isActive) {
      return { success: false, error: "CATEGORY_UNAVAILABLE" };
    }

    const days = Math.max(1, Math.ceil((validated.endDate.getTime() - validated.startDate.getTime()) / (1000 * 60 * 60 * 24)));

    let refreshedExtras: Array<{
      extraId: string;
      quantity: number;
      lineTotal: number;
      pricingType: "DAILY" | "FLAT";
      amount: number;
    }> = [];
    if (selectedExtras.length > 0) {
      const extraRows: Array<{ id: string; pricingType: "DAILY" | "FLAT"; amount: number }> =
        (db as any).extra && typeof (db as any).extra.findMany === "function"
          ? await (db as any).extra.findMany({
              where: { id: { in: selectedExtras.map((entry) => entry.extraId) }, isActive: true },
              select: { id: true, pricingType: true, amount: true },
            })
          : await db.$queryRawUnsafe<Array<{ id: string; pricingType: "DAILY" | "FLAT"; amount: number }>>(
              `SELECT id, "pricingType", amount FROM "Extra" WHERE "isActive" = true AND id IN (${selectedExtras.map((_, i) => `$${i + 1}`).join(",")})`,
              ...selectedExtras.map((entry) => entry.extraId)
            );
      const extraMap = new Map(extraRows.map((row) => [row.id, row]));
      refreshedExtras = selectedExtras
        .map((line) => {
          const extra = extraMap.get(line.extraId);
          if (!extra) return null;
          return {
            extraId: line.extraId,
            quantity: line.quantity,
            pricingType: extra.pricingType,
            amount: extra.amount,
            lineTotal: extra.pricingType === "DAILY" ? extra.amount * days * line.quantity : extra.amount * line.quantity,
          };
        })
        .filter(Boolean) as typeof refreshedExtras;
    }
    const { discount: bookingDiscount } = await loadBookingAdjustments(bookingId);
    const extrasTotal = refreshedExtras.reduce((sum, line) => sum + line.lineTotal, 0);
    const baseRental = category.dailyRate * days;
    const discountAmount = bookingDiscount ? Math.round((baseRental * bookingDiscount.percentage) / 100) : 0;
    const [taxPercentage, vehicleRatesIncludeTax] = await Promise.all([
      getTaxPercentage(),
      getVehicleRatesIncludeTax(),
    ]);
    const pricingRules = await evaluateBookingPricingRules({
      startDate: validated.startDate,
      endDate: validated.endDate,
      basePriceCents: category.dailyRate,
      extrasCents: extrasTotal,
      taxPercentage,
      baseRentalIncludesTax: vehicleRatesIncludeTax,
      bookingSource: "admin",
    });
    if (!pricingRules.ok) {
      return { success: false, error: pricingRules.error };
    }
    const { totalAmount } = calculateBookingAmounts({
      baseRentalCents: baseRental + pricingRules.evaluation.belowMinimumSurchargeCents + pricingRules.evaluation.lastMinuteSurchargeCents,
      extrasCents: extrasTotal,
      discountCents: discountAmount,
      taxPercentage,
      baseRentalIncludesTax: vehicleRatesIncludeTax,
    });
    const driverLicenseDeleteAfter = calculateDriverLicenseDeleteAfter(validated.endDate);

    await db.$transaction(async (tx) => {
      await ensureVehicleBlockoutsTable(tx as typeof db);
      const vehicleId = await selectAvailableVehicleForBooking({
        tx: tx as typeof db,
        bookingIdToExclude: bookingId,
        categoryId: validated.categoryId,
        startDate: validated.startDate,
        endDate: validated.endDate,
        preferredVehicleId: existing.vehicleId,
        specificVehicleId: validated.vehicleId || null,
      });

      if (!vehicleId) {
        throw new Error(validated.vehicleId ? "VEHICLE_UNAVAILABLE" : "CATEGORY_UNAVAILABLE");
      }

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          categoryId: validated.categoryId,
          vehicleId,
          customerName: validated.customerName,
          customerEmail: validated.customerEmail,
          customerPhone: validated.customerPhone,
          flightNumber: validated.flightNumber || null,
          birthDate: validated.birthDate,
          driverLicenseNumber: validated.driverLicenseNumber,
          licenseExpiryDate: validated.licenseExpiryDate,
          startDate: validated.startDate,
          endDate: validated.endDate,
          pickupLocationId: pickupLocationRecord.id,
          dropoffLocationId: dropoffLocationRecord.id,
          pickupLocation: pickupLocationRecord.name,
          dropoffLocation: dropoffLocationRecord.name,
          totalAmount,
          notes: validated.notes || null,
          driverLicenseUrl: existing.driverLicenseUrl,
        } as any,
      });

      if ((tx as any).bookingExtra && typeof (tx as any).bookingExtra.deleteMany === "function") {
        await (tx as any).bookingExtra.deleteMany({ where: { bookingId } });
        if (refreshedExtras.length > 0 && typeof (tx as any).bookingExtra.createMany === "function") {
          await (tx as any).bookingExtra.createMany({
            data: refreshedExtras.map((line) => ({
              bookingId,
              extraId: line.extraId,
              quantity: line.quantity,
              lineTotal: line.lineTotal,
            })),
          });
        }
      } else {
        await tx.$executeRaw`DELETE FROM "BookingExtra" WHERE "bookingId" = ${bookingId}`;
        for (const line of refreshedExtras) {
          await tx.$executeRaw`
            INSERT INTO "BookingExtra" ("bookingId", "extraId", quantity, "lineTotal")
            VALUES (${bookingId}, ${line.extraId}, ${line.quantity}, ${line.lineTotal})
          `;
        }
      }

      await tx.$executeRaw`
        UPDATE "Booking"
        SET "driverLicenseDeleteAfter" = ${driverLicenseDeleteAfter}
        WHERE id = ${bookingId}
      `;

      if (bookingDiscount) {
        await tx.$executeRaw`
          UPDATE "BookingDiscount"
          SET amount = ${discountAmount}
          WHERE "bookingId" = ${bookingId}
        `;
      }

      await tx.auditLog.create({
        data: {
          adminUserId: session.adminUserId,
          action: "BOOKING_UPDATED",
          bookingId,
        },
      });
    });

    if (existing.status === "PENDING" || existing.status === "CONFIRMED") {
      const invoiceResult = await sendInvoiceEstimateAction(bookingId, locale);
      if (!invoiceResult.success) {
        return { success: false, error: invoiceResult.error || "Booking updated but invoice refresh failed" };
      }
    }

    return {
      success: true,
      redirectUrl: `/${locale}/admin/bookings/${bookingId}`,
    };
  } catch (error: any) {
    if (error?.message === "CATEGORY_UNAVAILABLE") {
      return { success: false, error: "CATEGORY_UNAVAILABLE" };
    }
    if (error?.message === "VEHICLE_UNAVAILABLE") {
      return { success: false, error: "Selected vehicle is not available for that booking window" };
    }
    return {
      success: false,
      error: error?.message || "Failed to update booking",
    };
  }
}

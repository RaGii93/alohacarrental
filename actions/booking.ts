/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isLicenseActive } from "@/lib/license";
import { uploadBuffer, uploadFile } from "@/lib/uploads";
import { categoryBookingFormSchemaRefined } from "@/lib/validators";
import { bookingEmailHtml, sendEmail } from "@/lib/email";
import { getTenantConfig } from "@/lib/tenant";
import { generateInvoicePDF } from "@/lib/pdf";
import { getBlobProxyUrl } from "@/lib/blob";
import { calculateTaxAmount, getMinBookingDays, getTaxPercentage } from "@/lib/settings";
import { logAdminAction } from "@/lib/audit";

type BookingDocumentType = "INVOICE" | "SALES_RECEIPT" | "RENTAL_AGREEMENT";

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
  let extras: Array<{ id: string; quantity: number; lineTotal: number; extraName: string }> = [];
  let discount: { id: string; percentage: number; amount: number; code: string } | null = null;

  try {
    extras = await db.$queryRaw<Array<{ id: string; quantity: number; lineTotal: number; extraName: string }>>`
      SELECT be.id, be.quantity, be."lineTotal", e.name as "extraName"
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

export async function cancelExpiredHolds() {
  // Cancel PENDING bookings where holdExpiresAt < now
  const result = await db.booking.updateMany({
    where: {
      status: "PENDING",
      holdExpiresAt: {
        lt: new Date(),
      },
    },
    data: {
      status: "CANCELLED",
    },
  });

  return result.count;
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
      await sendEmail({
        to: booking.customerEmail,
        subject: `Booking Confirmed - ${booking.bookingCode}`,
        html: bookingEmailHtml({
          title: "Your booking has been confirmed",
          customerName: booking.customerName,
          bookingCode: booking.bookingCode,
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalAmountCents: booking.totalAmount,
        }),
        attachments:
          rentalAgreement.success && rentalAgreement.pdfBuffer
            ? [
                {
                  filename: rentalAgreement.filename,
                  content: rentalAgreement.pdfBuffer,
                  contentType: "application/pdf",
                },
              ]
            : undefined,
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
  const subtotalBeforeTax = Math.max(0, baseRental - discountAmount + extrasTotal);
  const taxAmount = Math.max(0, booking.totalAmount - subtotalBeforeTax);
  const effectiveTaxPercentage =
    subtotalBeforeTax > 0 ? Math.round((taxAmount * 10000) / subtotalBeforeTax) / 100 : 0;

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
    taxPercentage: effectiveTaxPercentage,
    totalAmount: booking.totalAmount,
    discountCode: bookingDiscount?.code,
    extras: adjustmentExtras.map((line) => ({
      name: line.extraName,
      quantity: line.quantity,
      lineTotal: line.lineTotal,
    })),
    paymentInstructions: getTenantConfig().paymentInstructions,
    tenantConfig: getTenantConfig(),
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

  return { success: true as const, booking, invoiceUrl: uploadResult.url, pdfBuffer: invoiceBuffer, filename };
}

export async function sendInvoiceEstimateAction(bookingId: string, locale: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: "Unauthorized" };
    if (!isLicenseActive() && session.role !== "ROOT") return { success: false, error: "BOOKING_DISABLED" };

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

    try {
      await sendEmail({
        to: updated.customerEmail,
        subject: `Invoice for Payment - ${updated.bookingCode}`,
        html: bookingEmailHtml({
          title: "Your invoice is ready for payment",
          customerName: updated.customerName,
          bookingCode: updated.bookingCode,
          startDate: updated.startDate,
          endDate: updated.endDate,
          totalAmountCents: updated.totalAmount,
          invoiceUrl: generated.invoiceUrl,
          documentLabel: "Invoice",
        }),
        attachments: [
          {
            filename: generated.filename,
            content: generated.pdfBuffer,
            contentType: "application/pdf",
          },
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

    const mailResult = await sendEmail({
      to: booking.customerEmail,
      subject: `Billing Document - ${booking.bookingCode}`,
      html: bookingEmailHtml({
        title: "Your billing document is ready",
        customerName: booking.customerName,
        bookingCode: booking.bookingCode,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalAmountCents: booking.totalAmount,
        invoiceUrl: billingDocumentUrl,
        documentLabel: "Billing document",
      }),
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

    try {
      await sendEmail({
        to: updated.customerEmail,
        subject: `Sales Receipt - ${updated.bookingCode}`,
        html: bookingEmailHtml({
          title: "Payment received. Your sales receipt is ready",
          customerName: updated.customerName,
          bookingCode: updated.bookingCode,
          startDate: updated.startDate,
          endDate: updated.endDate,
          totalAmountCents: updated.totalAmount,
          invoiceUrl: generated.invoiceUrl,
          documentLabel: "Sales receipt",
        }),
        attachments: [
          {
            filename: generated.filename,
            content: generated.pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });
    } catch {}

    return { success: true, booking: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create sales receipt" };
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
  const subtotalBeforeTax = Math.max(0, baseRental - discountAmount + extrasTotal);
  const taxPercentage = await getTaxPercentage();
  const taxAmount = calculateTaxAmount(subtotalBeforeTax, taxPercentage);
  const totalAmount = subtotalBeforeTax + taxAmount;

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
    const birthDate = new Date(formData.get("birthDate") as string);
    const driverLicenseNumber = formData.get("driverLicenseNumber") as string;
    const licenseExpiryDate = new Date(formData.get("licenseExpiryDate") as string);
    const startDate = new Date(formData.get("startDate") as string);
    const endDate = new Date(formData.get("endDate") as string);
    const pickupLocationId = (formData.get("pickupLocationId") as string | null) || null;
    const dropoffLocationId = (formData.get("dropoffLocationId") as string | null) || null;
    const pickupLocation = (formData.get("pickupLocation") as string | null) || null;
    const dropoffLocation = (formData.get("dropoffLocation") as string | null) || null;
    const notes = formData.get("notes") as string | null;
    const extrasPayload = (formData.get("selectedExtras") as string | null) || "[]";
    const driverLicenseUrl = formData.get("driverLicenseUrl") as string;
    const termsAccepted = formData.get("termsAccepted") === "true";

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

    if (!termsAccepted) {
      return { success: false, error: "Terms must be accepted" };
    }

    if (startDate >= endDate) {
      return { success: false, error: "Invalid date range" };
    }
    if (Number.isNaN(birthDate.getTime()) || Number.isNaN(licenseExpiryDate.getTime())) {
      return { success: false, error: "Invalid birth date or license expiry date" };
    }

    const validated = await categoryBookingFormSchemaRefined.parseAsync({
      categoryId,
      customerName,
      customerEmail,
      customerPhone,
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
    const minimumBookingDays = await getMinBookingDays();
    if (days < minimumBookingDays) {
      return {
        success: false,
        error: `Minimum booking duration is ${minimumBookingDays} day${minimumBookingDays > 1 ? "s" : ""}`,
      };
    }
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
    const subtotalBeforeTax = baseTotal + extrasTotal;
    const taxPercentage = await getTaxPercentage();
    const taxAmount = calculateTaxAmount(subtotalBeforeTax, taxPercentage);
    const totalAmount = subtotalBeforeTax + taxAmount;


    // Database transaction to allocate vehicle
    let booking;
    try {
      booking = await db.$transaction(async (tx) =>  {
        // Find available vehicle in category for the date range
        const availableVehicle = await tx.vehicle.findFirst({
          where: {
            categoryId,
            status: "ACTIVE",
            bookings: {
              none: {
                startDate: { lt: validated.endDate },
                endDate: { gt: validated.startDate },
                OR: [
                  { status: "CONFIRMED" },
                  {
                    status: "PENDING",
                    holdExpiresAt: { gt: new Date() },
                  },
                ],
              },
            },
          },
          orderBy: { name: "asc" },
        });

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

        const baseData = {
          categoryId,
          vehicleId: availableVehicle.id,
          customerName: validated.customerName,
          customerEmail: validated.customerEmail,
          customerPhone: validated.customerPhone,
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
          holdExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
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
          if (!message.includes("Unknown argument `birthDate`") && !message.includes("Unknown argument `licenseExpiryDate`")) {
            throw createError;
          }

          // Fallback for stale Prisma client: create with known fields, then patch dates in SQL.
          created = await tx.booking.create({ data: baseData as any });
          try {
            await tx.$executeRaw`
              UPDATE "Booking"
              SET "birthDate" = ${validated.birthDate}, "licenseExpiryDate" = ${validated.licenseExpiryDate}
              WHERE id = ${created.id}
            `;
          } catch {
            throw new Error("BOOKING_FIELDS_NOT_SAVED");
          }
        }

        const persisted = await tx.$queryRaw<Array<{ birthDate: Date | null; licenseExpiryDate: Date | null }>>`
          SELECT "birthDate", "licenseExpiryDate"
          FROM "Booking"
          WHERE id = ${created.id}
          LIMIT 1
        `;
        if (!persisted[0]?.birthDate || !persisted[0]?.licenseExpiryDate) {
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
      const tenant = getTenantConfig();
      const subject = `New Booking Created - ${booking.bookingCode}`;
      const customerHtml = bookingEmailHtml({
        title: "Booking request received",
        customerName: booking.customerName,
        bookingCode: booking.bookingCode,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalAmountCents: booking.totalAmount,
      });
      await sendEmail({
        to: booking.customerEmail,
        subject,
        html: customerHtml,
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
      redirectUrl: `/${locale}/book/success/${booking.bookingCode}`,
    };
  } catch (error: any) {
    console.error("Booking creation error:", error);
    return {
      success: false,
      error: error.message || "Failed to create booking",
    };
  }
}

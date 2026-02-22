/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isLicenseActive } from "@/lib/license";
import { uploadBuffer, uploadFile } from "@/lib/uploads";
import { categoryBookingFormSchemaRefined } from "@/lib/validators";
import { Prisma } from "@prisma/client";
import { bookingEmailHtml, sendEmail } from "@/lib/email";
import { getTenantConfig } from "@/lib/tenant";
import { generateInvoicePDF } from "@/lib/pdf";

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

    return { success: true, booking };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to add note" };
  }
}

export async function generateInvoiceAction(bookingId: string, locale: string) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    // Check license
    if (!isLicenseActive() && session.role !== "ROOT") {
      return { success: false, error: "BOOKING_DISABLED" };
    }

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
      return { success: false, error: "Booking not found" };
    }
    if (!booking.vehicleId || !booking.vehicle) {
      return { success: false, error: "No vehicle assigned to booking" };
    }
    if (booking.status === "DECLINED" || booking.status === "CANCELLED") {
      return { success: false, error: "Cannot invoice declined/cancelled booking" };
    }
    const { extras: adjustmentExtras, discount: bookingDiscount } = await loadBookingAdjustments(bookingId);

    const rentalDays = Math.max(1, Math.ceil((booking.endDate.getTime() - booking.startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const baseRental = booking.category.dailyRate * rentalDays;
    const extrasTotal = adjustmentExtras.reduce((sum, line) => sum + line.lineTotal, 0);
    const discountAmount = bookingDiscount ? Math.round((baseRental * bookingDiscount.percentage) / 100) : 0;
    const invoiceBuffer = await generateInvoicePDF({
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
      return { success: false, error: "Generated invoice PDF is invalid or empty" };
    }

    const uploadResult = await uploadBuffer(
      invoiceBuffer,
      "invoices",
      `invoice-${booking.bookingCode}.pdf`,
      "application/pdf"
    );
    if (!uploadResult.success || !uploadResult.url) {
      return { success: false, error: uploadResult.error || "Failed to upload invoice" };
    }

    const updated = await db.$transaction(async (tx) => {
      const bookingCols = await tx.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Booking'
      `;
      const hasPaymentReceivedAt = bookingCols.some((c) => c.column_name === "paymentReceivedAt");

      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "CONFIRMED",
          invoiceUrl: uploadResult.url!,
          ...(hasPaymentReceivedAt ? ({ paymentReceivedAt: new Date() } as any) : {}),
        } as any,
      });
      if (hasPaymentReceivedAt) {
        try {
          await tx.$executeRaw`
            UPDATE "Booking" SET "paymentReceivedAt" = ${new Date()} WHERE id = ${bookingId}
          `;
        } catch {}
      }
      await tx.vehicle.update({
        where: { id: booking.vehicleId! },
        data: { status: "ON_RENT" },
      });
      await tx.auditLog.create({
        data: {
          adminUserId: session.adminUserId,
          action: "INVOICE_CREATED_PAYMENT_RECEIVED",
          bookingId,
        },
      });
      return updatedBooking;
    });

    try {
      await sendEmail({
        to: updated.customerEmail,
        subject: `Invoice Ready - ${updated.bookingCode}`,
        html: bookingEmailHtml({
          title: "Your updated invoice is ready",
          customerName: updated.customerName,
          bookingCode: updated.bookingCode,
          startDate: updated.startDate,
          endDate: updated.endDate,
          totalAmountCents: updated.totalAmount,
          invoiceUrl: uploadResult.url,
        }),
      });
    } catch {}

    return { success: true, booking: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to generate invoice" };
  }
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
  const totalAmount = Math.max(0, baseRental - discountAmount + extrasTotal);

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

  return { booking, baseRental, extrasTotal, discountAmount, totalAmount };
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
    const invoiceResult = await generateInvoiceAction(bookingId, locale);
    if (!invoiceResult.success) return { success: false, error: invoiceResult.error || "Discount applied but invoice update failed" };

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
    const invoiceResult = await generateInvoiceAction(bookingId, locale);
    if (!invoiceResult.success) return { success: false, error: invoiceResult.error || "Extra added but invoice update failed" };

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
        const extraRows = await db.$queryRaw<Array<{ id: string; pricingType: "DAILY" | "FLAT"; amount: number }>>`
          SELECT id, "pricingType", amount
          FROM "Extra"
          WHERE "isActive" = true
            AND id IN (${Prisma.join(selectedExtras.map((entry) => entry.extraId))})
        `;
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
    const totalAmount = baseTotal + extrasTotal;


    // Database transaction to allocate vehicle
    let booking;
    try {
      booking = await db.$transaction(async (tx: Prisma.TransactionClient) =>  {
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

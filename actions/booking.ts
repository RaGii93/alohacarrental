/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isLicenseActive } from "@/lib/license";
import { uploadFile } from "@/lib/uploads";
import type { Prisma } from "@prisma/client";

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
      include: { vehicle: true },
    });

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    // TODO: Generate PDF and upload to Blob
    // For now, just return success
    return { success: true, booking };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to generate invoice" };
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
    const driverLicenseNumber = formData.get("driverLicenseNumber") as string;
    const startDate = new Date(formData.get("startDate") as string);
    const endDate = new Date(formData.get("endDate") as string);
    const pickupLocationId = (formData.get("pickupLocationId") as string | null) || null;
    const dropoffLocationId = (formData.get("dropoffLocationId") as string | null) || null;
    const pickupLocation = (formData.get("pickupLocation") as string | null) || null;
    const dropoffLocation = (formData.get("dropoffLocation") as string | null) || null;
    const notes = formData.get("notes") as string | null;
    const driverLicenseUrl = formData.get("driverLicenseUrl") as string;
    const termsAccepted = formData.get("termsAccepted") === "true";

    // Basic validation
    if (
      !categoryId ||
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !driverLicenseNumber ||
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
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalAmount = category.dailyRate * Math.max(1, days);


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
                startDate: { lt: endDate },
                endDate: { gt: startDate },
                status: { in: ["PENDING", "CONFIRMED"] },
                holdExpiresAt: { gt: new Date() },
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

        // Create booking
        return tx.booking.create({
          data: {
            categoryId,
            vehicleId: availableVehicle.id,
            customerName,
            customerEmail,
            customerPhone,
            driverLicenseNumber,
            startDate,
            endDate,
            pickupLocationId: pickupLocationRecord?.id ?? null,
            dropoffLocationId: dropoffLocationRecord?.id ?? null,
            pickupLocation: pickupLocationRecord?.name ?? pickupLocation,
            dropoffLocation: dropoffLocationRecord?.name ?? dropoffLocation,
            totalAmount,
            status: "PENDING",
            bookingCode,
            holdExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
            driverLicenseUrl,
            termsAcceptedAt: new Date(),
            notes,
          },
        });
      });
    } catch (error: any) {
      if (error.message === "CATEGORY_UNAVAILABLE") {
        return { success: false, error: "CATEGORY_UNAVAILABLE" };
      }
      throw error;
    }

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

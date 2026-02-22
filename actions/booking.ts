/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isLicenseActive } from "@/lib/license";
import { bookingFormSchemaRefined } from "@/lib/validators";
import { uploadFile } from "@/lib/uploads";

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

export async function createBookingAction(
  formData: FormData,
  locale: string
) {
  try {
    // Cancel expired holds first
    await cancelExpiredHolds();

    // Check license (allow if ACTIVE or ROOT)
    const session = await getSession();
    if (!isLicenseActive() && session?.role !== "ROOT") {
      return { success: false, error: "BOOKING_DISABLED" };
    }

    // Extract form fields
    const customerName = formData.get("customerName") as string;
    const customerEmail = formData.get("customerEmail") as string;
    const customerPhone = formData.get("customerPhone") as string;
    const vehicleId = formData.get("vehicleId") as string;
    const startDate = new Date(formData.get("startDate") as string);
    const endDate = new Date(formData.get("endDate") as string);
    const pickupLocation = formData.get("pickupLocation") as string | null;
    const dropoffLocation = formData.get("dropoffLocation") as string | null;
    const notes = formData.get("notes") as string | null;
    const driverLicenseFile = formData.get("driverLicense") as File | null;
    const paymentProofFile = formData.get("paymentProof") as File | null;
    // Extras: optional array of selected extras and total extras cost (in cents)
    const extrasList = formData.getAll("extras") as string[];
    const extrasTotal = Number(formData.get("extrasTotal") || 0);

    // Validate with Zod
    const validated = await bookingFormSchemaRefined.parseAsync({
      customerName,
      customerEmail,
      customerPhone,
      vehicleId,
      startDate,
      endDate,
      pickupLocation: pickupLocation || undefined,
      dropoffLocation: dropoffLocation || undefined,
      notes: notes || undefined,
    });

    // Verify vehicle exists and is ACTIVE
    const vehicle = await db.vehicle.findUnique({
      where: { id: validated.vehicleId },
    });

    if (!vehicle || vehicle.status !== "ACTIVE") {
      return { success: false, error: "VEHICLE_UNAVAILABLE" };
    }

    // Upload files
    let driverLicenseUrl: string | undefined;
    let paymentProofUrl: string | undefined;

    if (driverLicenseFile && driverLicenseFile.size > 0) {
      const uploadResult = await uploadFile(
        driverLicenseFile,
        `bookings/${validated.vehicleId}`
      );
      if (!uploadResult.success) {
        return { success: false, error: uploadResult.error || "File upload failed" };
      }
      driverLicenseUrl = uploadResult.url;
    }

    if (paymentProofFile && paymentProofFile.size > 0) {
      const uploadResult = await uploadFile(
        paymentProofFile,
        `bookings/${validated.vehicleId}`
      );
      if (!uploadResult.success) {
        return { success: false, error: uploadResult.error || "File upload failed" };
      }
      paymentProofUrl = uploadResult.url;
    }

    // Calculate total amount (for now, using a simple formula - can be enhanced)
    const days = Math.ceil(
      (validated.endDate.getTime() - validated.startDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const totalAmount = vehicle.dailyRate * days + (isNaN(extrasTotal) ? 0 : extrasTotal);

    // Database transaction with lock
    let booking;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      booking = await db.$transaction(async (tx: any) => {
        // Lock the vehicle row
        const lockedVehicle = await tx.$queryRaw`
          SELECT id FROM "Vehicle" WHERE id = ${validated.vehicleId} FOR UPDATE
        `;

        // Re-check overlap count for this vehicle
        const overlappingCount = await tx.booking.count({
          where: {
            vehicleId: validated.vehicleId,
            startDate: {
              lt: validated.endDate,
            },
            endDate: {
              gt: validated.startDate,
            },
            status: {
              in: ["PENDING", "CONFIRMED"],
            },
            holdExpiresAt: {
              gt: new Date(),
            },
          },
        });

        if (overlappingCount > 0) {
          throw new Error("VEHICLE_UNAVAILABLE");
        }

        // Create booking
        return tx.booking.create({
          data: {
            vehicleId: validated.vehicleId,
            customerName: validated.customerName,
            customerEmail: validated.customerEmail,
            customerPhone: validated.customerPhone,
            startDate: validated.startDate,
            endDate: validated.endDate,
            pickupLocation: validated.pickupLocation,
            dropoffLocation: validated.dropoffLocation,
            totalAmount,
            status: "PENDING",
            holdExpiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
            driverLicenseUrl,
            paymentProofUrl,
            notes: validated.notes,
            // append extras info into notes for auditing (we don't have a dedicated extras column)
            // if extras were provided, merge into notes JSON
            ...(extrasList && extrasList.length > 0
              ? { notes: `${validated.notes || ""}\nExtras: ${JSON.stringify(extrasList)}` }
              : {}),
          },
        });
      });
    } catch (error: any) {
      if (error.message === "VEHICLE_UNAVAILABLE") {
        return { success: false, error: "VEHICLE_UNAVAILABLE" };
      }
      throw error;
    }

    return {
      success: true,
      bookingId: booking.id,
      redirectUrl: `/${locale}/book/success/${booking.id}`,
    } as const;
  } catch (error: any) {
    console.error("Booking creation error:", error);
    return {
      success: false,
      error: error.message || "Failed to create booking",
    };
  }
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

export async function uploadPaymentProofAction(formData: FormData) {
  try {
    const bookingId = formData.get("bookingId") as string;
    const paymentProofFile = formData.get("paymentProof") as File | null;

    if (!bookingId) return { success: false, error: "Missing bookingId" };
    if (!paymentProofFile || paymentProofFile.size === 0) return { success: false, error: "No file provided" };

    const uploadResult = await uploadFile(paymentProofFile, `bookings/${bookingId}`);
    if (!uploadResult.success) return { success: false, error: uploadResult.error || "Upload failed" };

    await db.booking.update({ where: { id: bookingId }, data: { paymentProofUrl: uploadResult.url } });

    return { success: true, bookingId };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to upload payment proof" };
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
    const pickupLocation = formData.get("pickupLocation") as string | null;
    const dropoffLocation = formData.get("dropoffLocation") as string | null;
    const notes = formData.get("notes") as string | null;
    const driverLicenseUrl = formData.get("driverLicenseUrl") as string;
    const termsAccepted = formData.get("termsAccepted") === "true";

    // Basic validation
    if (!categoryId || !customerName || !customerEmail || !customerPhone || !driverLicenseNumber || !driverLicenseUrl) {
      return { success: false, error: "Missing required fields" };
    }

    if (!termsAccepted) {
      return { success: false, error: "Terms must be accepted" };
    }

    if (startDate >= endDate) {
      return { success: false, error: "Invalid date range" };
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
      booking = await db.$transaction(async (tx) => {
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
            pickupLocation,
            dropoffLocation,
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
